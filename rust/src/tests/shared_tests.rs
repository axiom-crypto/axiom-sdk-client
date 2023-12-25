use axiom_codec::{
    constants::USER_MAX_OUTPUTS,
    types::field_elements::{FieldSubqueryResult, SUBQUERY_RESULT_LEN},
    utils::native::decode_hilo_to_h256,
    HiLo,
};
use axiom_eth::{
    halo2_proofs::plonk::VerifyingKey,
    halo2curves::{
        bn256::{Fr, G1Affine},
        group::GroupEncoding,
    },
    snark_verifier::pcs::{
        kzg::{KzgAccumulator, LimbsEncoding},
        AccumulatorEncoding,
    },
    snark_verifier_sdk::{NativeLoader, Snark, BITS, LIMBS},
    utils::{keccak::decorator::RlcKeccakCircuitParams, snark_verifier::NUM_FE_ACCUMULATOR},
};
use axiom_query::verify_compute::utils::{
    get_metadata_from_protocol, get_onchain_vk_from_vk, write_onchain_vkey,
};
use ethers::providers::Http;
use itertools::Itertools;

use crate::{
    run::inner::{keygen, mock, run},
    scaffold::AxiomCircuitScaffold,
    types::{AxiomCircuitParams, AxiomV2CircuitOutput, AxiomV2DataAndResults},
    utils::get_provider,
};

const NUM_BYTES_ACCUMULATOR: usize = 64;

pub fn mock_test<S: AxiomCircuitScaffold<Http, Fr>>(params: AxiomCircuitParams) {
    let client = get_provider();
    mock::<_, S>(client, params, None);
}

pub fn single_instance_test(
    instances: Vec<Vec<Fr>>,
    num_user_output_fe: usize,
    num_subquery_fe: usize,
    results: AxiomV2DataAndResults,
    inner_snark: Option<Snark>,
) {
    //check that there's only one instance column
    assert_eq!(instances.len(), 1);
    let mut instances = instances.get(0).unwrap().clone();
    if let Some(snark) = inner_snark {
        assert_eq!(
            instances.len(),
            NUM_FE_ACCUMULATOR + num_user_output_fe + num_subquery_fe
        );
        let inner_instances = snark.instances.get(0).unwrap().clone();
        <LimbsEncoding<LIMBS, BITS> as AccumulatorEncoding<G1Affine, NativeLoader>>::from_repr(
            &instances[..NUM_FE_ACCUMULATOR].iter().collect_vec(),
        )
        .unwrap();
        instances.drain(0..NUM_FE_ACCUMULATOR);
        assert_eq!(instances, inner_instances);
    }
    //check that number of instances is equal to number of user output field elements + number of subquery field elements
    assert_eq!(instances.len(), num_user_output_fe + num_subquery_fe);
    //check that user output field elements are all zero (as we don't add any in these tests)
    assert_eq!(
        &instances[0..num_user_output_fe],
        &vec![Fr::from(0); num_user_output_fe]
    );
    //check that there's only one subquery
    assert_eq!(results.data_query.len(), 1);
    let subquery = FieldSubqueryResult::<Fr>::from(results.data_query.get(0).unwrap().clone());
    //check the instances that correspond to single data subquery
    assert_eq!(
        subquery.to_fixed_array(),
        &instances[num_user_output_fe..num_user_output_fe + SUBQUERY_RESULT_LEN]
    );
    //check that remaining instances are zero
    assert_eq!(
        &instances[num_user_output_fe + SUBQUERY_RESULT_LEN..],
        &vec![Fr::from(0); num_subquery_fe - SUBQUERY_RESULT_LEN]
    );
}

pub fn check_compute_proof_format(output: AxiomV2CircuitOutput, is_aggregation: bool) {
    let result_len = output.data.compute_results.len();
    let mut instances = output.snark.instances[0].clone();

    //check compute accumulator
    let kzg_accumulators = &output.compute_query.compute_proof[0..NUM_BYTES_ACCUMULATOR];
    if !is_aggregation {
        assert_eq!(kzg_accumulators, &vec![0; NUM_BYTES_ACCUMULATOR]);
    } else {
        let KzgAccumulator { lhs, rhs } =
            <LimbsEncoding<LIMBS, BITS> as AccumulatorEncoding<G1Affine, NativeLoader>>::from_repr(
                &instances[..NUM_FE_ACCUMULATOR].iter().collect_vec(),
            )
            .unwrap();
        assert_eq!(&kzg_accumulators[0..32], lhs.to_bytes().as_ref());
        assert_eq!(&kzg_accumulators[32..64], rhs.to_bytes().as_ref());
        instances.drain(0..NUM_FE_ACCUMULATOR);
    }

    //check compute results
    let compute_results = instances
        .chunks(2)
        .take(result_len)
        .map(|c| decode_hilo_to_h256(HiLo::from_hi_lo([c[0], c[1]])))
        .collect_vec();
    assert_eq!(compute_results, output.data.compute_results);
    assert_eq!(
        &output.compute_query.compute_proof
            [NUM_BYTES_ACCUMULATOR..NUM_BYTES_ACCUMULATOR + result_len * 2],
        compute_results
            .iter()
            .flat_map(|a| a.to_fixed_bytes())
            .collect_vec()
            .as_slice()
    );

    //check compute proof transcript
    assert_eq!(
        &output.compute_query.compute_proof[NUM_BYTES_ACCUMULATOR + result_len * 2 * 32..],
        output.snark.proof()
    );
}

pub fn check_compute_query_format(
    output: AxiomV2CircuitOutput,
    params: AxiomCircuitParams,
    vk: VerifyingKey<G1Affine>,
) {
    let rlc_params = RlcKeccakCircuitParams::from(params.clone()).rlc;
    //check vkey is the same
    let metadata =
        get_metadata_from_protocol(&output.snark.protocol, rlc_params, USER_MAX_OUTPUTS).unwrap();
    let onchain_vk = get_onchain_vk_from_vk(&vk, metadata);
    let onchain_vk_h256 = write_onchain_vkey(&onchain_vk).unwrap();
    assert_eq!(output.compute_query.vkey, onchain_vk_h256);

    //check k is correct
    let rlc_keccak_circuit_params = RlcKeccakCircuitParams::from(params.clone());
    assert_eq!(output.compute_query.k, rlc_keccak_circuit_params.k() as u8);

    //check result_len is correct
    assert_eq!(
        output.compute_query.result_len,
        output.data.compute_results.len() as u16
    );
}

pub fn check_compute_proof_and_query_format<S: AxiomCircuitScaffold<Http, Fr>>(
    params: AxiomCircuitParams,
    is_aggregation: bool,
) {
    let client = get_provider();
    let (vk, pk) = keygen::<_, S>(client.clone(), params.clone(), None);
    let output = run::<_, S>(client, params.clone(), None, pk);
    check_compute_proof_format(output.clone(), is_aggregation);
    check_compute_query_format(output, params, vk);
}

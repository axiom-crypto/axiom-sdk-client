use std::env;

use axiom_codec::{
    constants::USER_MAX_OUTPUTS,
    types::native::{AxiomV2ComputeQuery, AxiomV2ComputeSnark},
};
use axiom_query::{
    axiom_eth::{
        halo2curves::bn256::G1Affine,
        snark_verifier::pcs::{
            kzg::{KzgAccumulator, LimbsEncoding},
            AccumulatorEncoding,
        },
        snark_verifier_sdk::{NativeLoader, Snark, BITS, LIMBS},
        utils::{keccak::decorator::RlcKeccakCircuitParams, snark_verifier::NUM_FE_ACCUMULATOR},
    },
    verify_compute::utils::{
        get_metadata_from_protocol, get_onchain_vk_from_protocol, write_onchain_vkey,
    },
};
use dotenv::dotenv;
use ethers::providers::{Http, Provider};
use itertools::Itertools;

use crate::types::{AxiomCircuitParams, AxiomV2DataAndResults};

pub fn build_axiom_v2_compute_query(
    snark: Snark,
    params: AxiomCircuitParams,
    results: AxiomV2DataAndResults,
) -> AxiomV2ComputeQuery {
    let rlc_keccak_params = RlcKeccakCircuitParams::from(params);
    let rlc_params = rlc_keccak_params.clone().rlc;
    let metadata =
        get_metadata_from_protocol(&snark.protocol, rlc_params, USER_MAX_OUTPUTS).unwrap();
    let k = rlc_keccak_params.k();
    let partial_vk = get_onchain_vk_from_protocol(&snark.protocol, metadata.clone());
    let partial_vk_output = write_onchain_vkey(&partial_vk).unwrap();
    let result_len = results.compute_results.len() as u16;
    let kzg_accumulator = if metadata.is_aggregation {
        let agg_instances = &snark.instances[0];
        let KzgAccumulator { lhs, rhs } =
            <LimbsEncoding<LIMBS, BITS> as AccumulatorEncoding<G1Affine, NativeLoader>>::from_repr(
                &agg_instances[..NUM_FE_ACCUMULATOR].iter().collect_vec(),
            )
            .unwrap();
        Some((lhs, rhs))
    } else {
        None
    };
    let compute_proof = AxiomV2ComputeSnark {
        kzg_accumulator,
        compute_results: results.compute_results.clone(),
        proof_transcript: snark.proof,
    };
    AxiomV2ComputeQuery {
        k: k as u8,
        result_len,
        compute_proof: compute_proof.encode().unwrap().into(),
        vkey: partial_vk_output,
    }
}

pub fn get_provider() -> Provider<Http> {
    dotenv().ok();
    Provider::<Http>::try_from(env::var("PROVIDER_URI").expect("PROVIDER_URI not set")).unwrap()
}

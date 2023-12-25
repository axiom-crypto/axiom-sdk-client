use std::{env, fs::File, io::Write};

use anyhow::bail;
use axiom_codec::{
    constants::USER_MAX_OUTPUTS,
    types::native::{AxiomV2ComputeQuery, AxiomV2ComputeSnark},
};
use axiom_eth::{
    halo2curves::bn256::G1Affine,
    snark_verifier::{
        pcs::{
            kzg::{KzgAccumulator, LimbsEncoding},
            AccumulatorEncoding,
        },
        verifier::plonk::PlonkProtocol,
    },
    snark_verifier_sdk::{
        halo2::aggregation::AggregationCircuit, CircuitExt, NativeLoader, Snark, BITS, LIMBS,
    },
    utils::{keccak::decorator::RlcKeccakCircuitParams, snark_verifier::NUM_FE_ACCUMULATOR},
};
use axiom_query::{
    utils::client_circuit::metadata::AxiomV2CircuitMetadata,
    verify_compute::utils::{get_onchain_vk_from_protocol, write_onchain_vkey},
};
use dotenv::dotenv;
use ethers::providers::{Http, Provider};
use itertools::Itertools;

use crate::types::{AxiomCircuitParams, AxiomV2DataAndResults};

/// Need to provide AxiomCircuitParams for additional context, otherwise you have
/// to parse the AxiomCircuitParams data from the custom gate information in `protocol`
pub fn get_metadata_from_protocol(
    protocol: &PlonkProtocol<G1Affine>,
    params: AxiomCircuitParams,
    max_outputs: usize,
) -> anyhow::Result<AxiomV2CircuitMetadata> {
    let rlc_keccak_params = RlcKeccakCircuitParams::from(params);
    let rlc_params = rlc_keccak_params.rlc;
    let num_advice_per_phase = rlc_params
        .base
        .num_advice_per_phase
        .iter()
        .map(|x| *x as u16)
        .collect();
    let num_lookup_advice_per_phase = rlc_params
        .base
        .num_lookup_advice_per_phase
        .iter()
        .map(|x| *x as u8)
        .collect();
    let num_rlc_columns = rlc_params.num_rlc_columns as u16;
    let num_fixed = rlc_params.base.num_fixed as u8;
    let mut metadata = AxiomV2CircuitMetadata {
        version: 0,
        num_advice_per_phase,
        num_lookup_advice_per_phase,
        num_rlc_columns,
        num_fixed,
        max_outputs: max_outputs as u16,
        ..Default::default()
    };

    if protocol.num_instance.len() != 1 {
        bail!("Only one instance column supported right now");
    }
    metadata.num_instance = protocol.num_instance.iter().map(|&x| x as u32).collect();
    let mut num_challenge_incl_system = protocol.num_challenge.clone();
    // This `num_challenge` counts only the challenges used inside the circuit - it excludes challenges that are part of the halo2 system.
    // The full challenges, which is what `plonk_protocol.num_challenge` stores, is:
    // ```ignore
    // [
    //   my_phase0_challenges,
    //   ...
    //   [..my_phasen_challenges, theta],
    //   [beta, gamma],
    //   [alpha],
    // ]
    // ```
    if num_challenge_incl_system.pop() != Some(1) {
        bail!("last challenge must be [alpha]");
    }
    if num_challenge_incl_system.pop() != Some(2) {
        bail!("second last challenge must be [beta, gamma]");
    }
    let last_challenge = num_challenge_incl_system.last_mut();
    if last_challenge.is_none() {
        bail!("num_challenge must have at least 3 challenges");
    }
    let last_challenge = last_challenge.unwrap();
    if *last_challenge == 0 {
        bail!("third last challenge must include theta");
    }
    *last_challenge -= 1;
    let num_challenge: Vec<u8> = num_challenge_incl_system.iter().map(|x| *x as u8).collect();
    if num_challenge != vec![0]
        && num_challenge != vec![1, 0]
        && rlc_keccak_params.keccak_rows_per_round == 0
    {
        log::debug!("num_challenge: {:?}", num_challenge);
        bail!("Only phase0 BaseCircuitBuilder or phase0+1 RlcCircuitBuilder supported right now");
    }
    if rlc_keccak_params.keccak_rows_per_round != 0 {
        log::warn!("Circuit with keccak must be aggregated before submitting on chain");
    }
    metadata.num_challenge = num_challenge;

    metadata.is_aggregation = if protocol.accumulator_indices.is_empty() {
        false
    } else {
        if protocol.accumulator_indices.len() != 1
            || protocol.accumulator_indices[0] != AggregationCircuit::accumulator_indices().unwrap()
        {
            bail!("invalid accumulator indices");
        }
        true
    };

    Ok(metadata)
}

pub fn build_axiom_v2_compute_query(
    snark: Snark,
    params: AxiomCircuitParams,
    results: AxiomV2DataAndResults,
) -> AxiomV2ComputeQuery {
    let metadata =
        get_metadata_from_protocol(&snark.protocol, params.clone(), USER_MAX_OUTPUTS).unwrap();
    let k = RlcKeccakCircuitParams::from(params).k();
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

pub fn write_output(output: AxiomV2DataAndResults, path: &str) {
    let serialized = serde_json::to_string_pretty(&output).unwrap();
    let mut file = File::create(path).unwrap();
    file.write_all(serialized.as_bytes()).unwrap();
}

pub fn get_provider() -> Provider<Http> {
    dotenv().ok();
    Provider::<Http>::try_from(env::var("PROVIDER_URI").expect("PROVIDER_URI not set")).unwrap()
}

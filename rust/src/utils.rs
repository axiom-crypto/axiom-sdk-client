use anyhow::bail;
use axiom_codec::constants::USER_MAX_OUTPUTS;
use axiom_codec::types::native::{AxiomV2ComputeQuery, AxiomV2ComputeSnark};
use axiom_eth::halo2_base::utils::ScalarField;
use axiom_eth::halo2_proofs::plonk::VerifyingKey;
use axiom_eth::halo2curves::bn256::G1Affine;
use axiom_eth::halo2curves::ff::PrimeField;
use axiom_eth::halo2curves::serde::SerdeObject;
use axiom_eth::halo2curves::CurveAffine;
use axiom_eth::rlc::circuit::RlcCircuitParams;
use axiom_eth::snark_verifier::system::halo2::transcript_initial_state;
use axiom_eth::snark_verifier::verifier::plonk::PlonkProtocol;
use axiom_eth::snark_verifier_sdk::halo2::aggregation::AggregationCircuit;
use axiom_eth::snark_verifier_sdk::{CircuitExt, Snark};
use axiom_eth::Field;
use axiom_query::utils::client_circuit::metadata::AxiomV2CircuitMetadata;
use axiom_query::utils::client_circuit::vkey::OnchainVerifyingKey;
use dotenv::dotenv;
use ethers::providers::{Http, Provider};
use ethers::types::H256;
use std::env;
use std::io::{Result, Write};

use crate::types::AxiomV2CircuitScaffoldOutput;

fn write_field_le<F: Field>(writer: &mut impl Write, fe: F) -> Result<()> {
    let repr = ScalarField::to_bytes_le(&fe);
    writer.write_all(&repr)?;
    Ok(())
}

fn write_curve_compressed<C: CurveAffine>(writer: &mut impl Write, point: C) -> Result<()> {
    let compressed = point.to_bytes();
    writer.write_all(compressed.as_ref())?;
    Ok(())
}

pub fn write_onchain_vkey<C>(vkey: &OnchainVerifyingKey<C>) -> anyhow::Result<Vec<H256>>
where
    C: CurveAffine + SerdeObject,
    C::Scalar: Field + SerdeObject,
{
    let _metadata = vkey.circuit_metadata.encode()?;

    let tmp = C::Repr::default();
    let compressed_curve_bytes = tmp.as_ref().len();
    let tmp = <C::Scalar as PrimeField>::Repr::default();
    let field_bytes = tmp.as_ref().len();
    let mut writer =
        Vec::with_capacity(field_bytes + vkey.preprocessed.len() * compressed_curve_bytes);

    // writer.write_all(&metadata.to_fixed_bytes())?;
    write_field_le(&mut writer, vkey.transcript_initial_state)?;
    for &point in &vkey.preprocessed {
        write_curve_compressed(&mut writer, point)?;
    }
    Ok(writer.chunks_exact(32).map(H256::from_slice).collect())
}

/// Requires additional context about the Axiom circuit, in the form of the `circuit_metadata`.
pub fn get_onchain_vk_from_vk<C: CurveAffine>(
    vk: &VerifyingKey<C>,
    circuit_metadata: AxiomV2CircuitMetadata,
) -> OnchainVerifyingKey<C> {
    let preprocessed = vk
        .fixed_commitments()
        .iter()
        .chain(vk.permutation().commitments().iter())
        .cloned()
        .map(Into::into)
        .collect();
    let transcript_initial_state = transcript_initial_state(vk);
    OnchainVerifyingKey {
        circuit_metadata,
        preprocessed,
        transcript_initial_state,
    }
}

pub fn get_onchain_vk_from_protocol<C: CurveAffine>(
    protocol: &PlonkProtocol<C>,
    circuit_metadata: AxiomV2CircuitMetadata,
) -> OnchainVerifyingKey<C> {
    let preprocessed = protocol.preprocessed.clone();
    let transcript_initial_state = protocol.transcript_initial_state.unwrap();
    OnchainVerifyingKey {
        circuit_metadata,
        preprocessed,
        transcript_initial_state,
    }
}

/// Need to provide RlcCircuitParams for additional context, otherwise you have
/// to parse the RlcCircuitParams data from the custom gate information in `protocol`
pub fn get_metadata_from_protocol(
    protocol: &PlonkProtocol<G1Affine>,
    rlc_params: RlcCircuitParams,
    max_outputs: usize,
) -> anyhow::Result<AxiomV2CircuitMetadata> {
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
    if num_challenge != vec![0] && num_challenge != vec![0, 1] {
        log::debug!("num_challenge: {:?}", num_challenge);
        bail!("Only phase0 BaseCircuitBuilder or phase0+1 RlcCircuitBuilder supported right now");
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

pub fn get_provider() -> Provider<Http> {
    dotenv().ok();

    Provider::<Http>::try_from(env::var("PROVIDER_URI").expect("PROVIDER_URI not set")).unwrap()
}

pub fn build_axiom_v2_compute_query(
    snark: Snark,
    params: RlcCircuitParams,
    output: AxiomV2CircuitScaffoldOutput,
) -> AxiomV2ComputeQuery {
    let metadata =
        get_metadata_from_protocol(&snark.protocol, params.clone(), USER_MAX_OUTPUTS).unwrap();
    let partial_vk = get_onchain_vk_from_protocol(&snark.protocol, metadata);
    let partial_vk_output = write_onchain_vkey(&partial_vk).unwrap();
    let result_len = output.compute_results.len() as u16;
    let compute_proof = AxiomV2ComputeSnark {
        kzg_accumulator: None,
        compute_results: output.compute_results.clone(),
        proof_transcript: snark.proof,
    };
    AxiomV2ComputeQuery {
        k: params.base.k as u8,
        result_len,
        compute_proof: compute_proof.encode().unwrap().into(),
        vkey: partial_vk_output,
    }
}

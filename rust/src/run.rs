use std::{
    fs::{create_dir_all, File},
    path::Path, io::Write,
};

use crate::{scaffold::{AxiomCircuitRunner, AxiomCircuitScaffold}, subquery::types::AxiomV2CircuitOutput, vkey::{get_partial_vk_from_vk, write_partial_vkey}};
use axiom_codec::types::native::AxiomV2ComputeQuery;
use axiom_eth::{
    halo2_base::{gates::circuit::BaseCircuitParams, utils::fs::gen_srs},
    halo2_proofs::{
        dev::MockProver,
        plonk::{keygen_pk, keygen_vk, ProvingKey, VerifyingKey},
        SerdeFormat,
    },
    halo2curves::bn256::{Fr, G1Affine},
    snark_verifier_sdk::{halo2::gen_snark_shplonk, Snark},
};
use ethers::providers::{JsonRpcClient, Provider};

pub fn mock<P: JsonRpcClient + Clone, S: AxiomCircuitScaffold<P, Fr>>(
    circuit: S,
    provider: Provider<P>,
    circuit_params: BaseCircuitParams,
    num_rlc_columns: Option<usize>,
    keccak_rows_per_round: Option<usize>,
) {
    let k = circuit_params.k;
    let mut runner = AxiomCircuitRunner::new(
        circuit,
        provider,
        circuit_params,
        num_rlc_columns,
        keccak_rows_per_round,
        None,
    );
    if keccak_rows_per_round.is_some() {
        runner.calculate_params();
    }
    let instances = runner.instances();
    MockProver::run(k as u32, &runner, instances)
        .unwrap()
        .assert_satisfied();
}

pub fn keygen<P: JsonRpcClient + Clone, S: AxiomCircuitScaffold<P, Fr>>(
    circuit: S,
    provider: Provider<P>,
    circuit_params: BaseCircuitParams,
    num_rlc_columns: Option<usize>,
    keccak_rows_per_round: Option<usize>,
) -> (VerifyingKey<G1Affine>, ProvingKey<G1Affine>) {
    let params = gen_srs(circuit_params.k as u32);
    let mut runner = AxiomCircuitRunner::new(
        circuit,
        provider,
        circuit_params,
        num_rlc_columns,
        keccak_rows_per_round,
        None,
    );
    if keccak_rows_per_round.is_some() {
        runner.calculate_params();
    }
    let vk = keygen_vk(&params, &runner).expect("Failed to generate vk");
    let path = Path::new("data/vk.bin");
    if let Some(parent) = path.parent() {
        create_dir_all(parent).expect("Failed to create data directory");
    }
    let mut vk_file = File::create(path).expect("Failed to create vk file");
    vk.write(&mut vk_file, SerdeFormat::RawBytesUnchecked)
        .expect("Failed to write vk");
    let pk = keygen_pk(&params, vk.clone(), &runner).expect("Failed to generate pk");
    let path = Path::new("data/pk.bin");
    let mut pk_file = File::create(path).expect("Failed to create pk file");
    pk.write(&mut pk_file, SerdeFormat::Processed)
        .expect("Failed to write pk");
    (vk, pk)
}

pub fn prove<P: JsonRpcClient + Clone, S: AxiomCircuitScaffold<P, Fr>>(
    circuit: S,
    provider: Provider<P>,
    circuit_params: BaseCircuitParams,
    num_rlc_columns: Option<usize>,
    keccak_rows_per_round: Option<usize>,
    pk: ProvingKey<G1Affine>,
) -> Snark {
    let params = gen_srs(circuit_params.k as u32);
    let mut runner = AxiomCircuitRunner::new(
        circuit,
        provider,
        circuit_params,
        num_rlc_columns,
        keccak_rows_per_round,
        None,
    );
    if keccak_rows_per_round.is_some() {
        runner.calculate_params();
    }
    gen_snark_shplonk(&params, &pk, runner, None::<&str>)
}

pub fn run<P: JsonRpcClient + Clone, S: AxiomCircuitScaffold<P, Fr>>(
    circuit: S,
    provider: Provider<P>,
    circuit_params: BaseCircuitParams,
    num_rlc_columns: Option<usize>,
    keccak_rows_per_round: Option<usize>,
    pk: ProvingKey<G1Affine>,
    vk: VerifyingKey<G1Affine>,
) -> AxiomV2CircuitOutput {
    let k = circuit_params.k;
    let params = gen_srs(k as u32);
    let mut runner = AxiomCircuitRunner::new(
        circuit,
        provider,
        circuit_params,
        num_rlc_columns,
        keccak_rows_per_round,
        None,
    );
    let output = runner.scaffold_output();
    if keccak_rows_per_round.is_some() {
        runner.calculate_params();
    }
    let snark = gen_snark_shplonk(&params, &pk, runner, None::<&str>);
    let partial_vk = get_partial_vk_from_vk(&vk);
    let partial_vk_output = write_partial_vkey(&partial_vk).unwrap();
    let mut compute_proof = output.compute_results.iter().map(|x| x.to_fixed_bytes()).collect::<Vec<_>>().concat();
    compute_proof.extend(snark.proof);
    let compute_query = AxiomV2ComputeQuery {
        k: k as u8,
        result_len: output.compute_results.len() as u16,
        compute_proof: compute_proof.into(),
        vkey: partial_vk_output,
    };
    let output = AxiomV2CircuitOutput {
        compute_query,
        scaffold_output: output,
    };
    let serialized = serde_json::to_string_pretty(&output).unwrap();
    let mut file = File::create("data/output.json").unwrap();
    file.write_all(serialized.as_bytes()).unwrap();
    output
}
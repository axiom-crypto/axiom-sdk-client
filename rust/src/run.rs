use std::{
    fs::{create_dir_all, File},
    path::Path,
};

use crate::scaffold::{AxiomCircuitRunner, AxiomCircuitScaffold};
use axiom_eth::{
    halo2_base::{gates::circuit::BaseCircuitParams, utils::fs::gen_srs},
    halo2_proofs::{
        dev::MockProver,
        plonk::{keygen_pk, keygen_vk, ProvingKey},
        SerdeFormat,
    },
    halo2curves::bn256::{Fr, G1Affine},
    snark_verifier_sdk::halo2::gen_snark_shplonk,
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
    runner.write_output("data/output.json");
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
) -> ProvingKey<G1Affine> {
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
    runner.write_output("data/output.json");
    let vk = keygen_vk(&params, &runner).expect("Failed to generate vk");
    let path = Path::new("data/vk.bin");
    if let Some(parent) = path.parent() {
        create_dir_all(parent).expect("Failed to create data directory");
    }
    let mut vk_file = File::create(path).expect("Failed to create vk file");
    vk.write(&mut vk_file, SerdeFormat::RawBytesUnchecked)
        .expect("Failed to write vk");
    let pk = keygen_pk(&params, vk, &runner).expect("Failed to generate pk");
    let path = Path::new("data/pk.bin");
    let mut pk_file = File::create(path).expect("Failed to create pk file");
    pk.write(&mut pk_file, SerdeFormat::Processed)
        .expect("Failed to write pk");
    pk
}

pub fn prove<P: JsonRpcClient + Clone, S: AxiomCircuitScaffold<P, Fr>>(
    circuit: S,
    provider: Provider<P>,
    circuit_params: BaseCircuitParams,
    num_rlc_columns: Option<usize>,
    keccak_rows_per_round: Option<usize>,
    pk: ProvingKey<G1Affine>,
) {
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
    runner.write_output("data/output.json");
    gen_snark_shplonk(&params, &pk, runner, None::<&str>);
}

use std::{
    fs::{create_dir_all, File},
    io::Write,
    path::Path,
};

use crate::{
    scaffold::{AxiomCircuitRunner, AxiomCircuitScaffold},
    types::{AxiomCircuitParams, AxiomV2CircuitOutput},
    utils::build_axiom_v2_compute_query,
};

use axiom_eth::{
    halo2_base::utils::fs::gen_srs,
    halo2_proofs::{
        dev::MockProver,
        plonk::{keygen_pk, keygen_vk, ProvingKey, VerifyingKey},
        SerdeFormat,
    },
    halo2curves::bn256::{Fr, G1Affine},
    snark_verifier_sdk::{halo2::gen_snark_shplonk, Snark},
    utils::keccak::decorator::RlcKeccakCircuitParams,
};
use ethers::providers::{JsonRpcClient, Provider};

pub fn mock<P: JsonRpcClient + Clone, S: AxiomCircuitScaffold<P, Fr>>(
    provider: Provider<P>,
    raw_circuit_params: AxiomCircuitParams,
) {
    let circuit_params = RlcKeccakCircuitParams::from(raw_circuit_params.clone());
    let k = circuit_params.k();
    let mut runner = AxiomCircuitRunner::<_, _, S>::new(provider, raw_circuit_params);
    if circuit_params.keccak_rows_per_round > 0 {
        runner.calculate_params();
    }
    let instances = runner.instances();
    MockProver::run(k as u32, &runner, instances)
        .unwrap()
        .assert_satisfied();
}

pub fn keygen<P: JsonRpcClient + Clone, S: AxiomCircuitScaffold<P, Fr>>(
    provider: Provider<P>,
    raw_circuit_params: AxiomCircuitParams,
) -> (VerifyingKey<G1Affine>, ProvingKey<G1Affine>) {
    let circuit_params = RlcKeccakCircuitParams::from(raw_circuit_params.clone());
    let params = gen_srs(circuit_params.k() as u32);
    let mut runner = AxiomCircuitRunner::<_, _, S>::new(provider, raw_circuit_params);
    if circuit_params.keccak_rows_per_round > 0 {
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
    provider: Provider<P>,
    raw_circuit_params: AxiomCircuitParams,
    pk: ProvingKey<G1Affine>,
) -> Snark {
    let circuit_params = RlcKeccakCircuitParams::from(raw_circuit_params.clone());
    let params = gen_srs(circuit_params.k() as u32);
    let mut runner = AxiomCircuitRunner::<_, _, S>::new(provider, raw_circuit_params);
    if circuit_params.keccak_rows_per_round > 0 {
        runner.calculate_params();
    }
    gen_snark_shplonk(&params, &pk, runner, None::<&str>)
}

pub fn run<P: JsonRpcClient + Clone, S: AxiomCircuitScaffold<P, Fr>>(
    provider: Provider<P>,
    raw_circuit_params: AxiomCircuitParams,
    pk: ProvingKey<G1Affine>,
) -> AxiomV2CircuitOutput {
    let circuit_params = RlcKeccakCircuitParams::from(raw_circuit_params.clone());
    let k = circuit_params.k();
    let params = gen_srs(k as u32);
    let mut runner = AxiomCircuitRunner::<_, _, S>::new(provider, raw_circuit_params.clone());
    let output = runner.scaffold_output();
    if circuit_params.keccak_rows_per_round > 0 {
        runner.calculate_params();
    }
    let snark = gen_snark_shplonk(&params, &pk, runner, None::<&str>);
    let compute_query = build_axiom_v2_compute_query(snark, circuit_params.rlc, output.clone());
    let output = AxiomV2CircuitOutput {
        compute_query,
        scaffold_output: output,
    };
    let serialized = serde_json::to_string_pretty(&output).unwrap();
    let mut file = File::create("data/output.json").unwrap();
    file.write_all(serialized.as_bytes()).unwrap();
    output
}

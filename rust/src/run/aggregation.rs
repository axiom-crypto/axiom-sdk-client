use std::{
    fs::{create_dir_all, File},
    io::Write,
    path::Path,
};

use axiom_eth::{
    halo2_base::{gates::circuit::CircuitBuilderStage, utils::fs::gen_srs},
    halo2_proofs::{
        dev::MockProver,
        plonk::{keygen_pk, keygen_vk, ProvingKey, VerifyingKey},
        SerdeFormat,
    },
    halo2curves::bn256::{Fr, G1Affine},
    snark_verifier_sdk::{
        halo2::aggregation::{AggregationCircuit, VerifierUniversality},
        Snark, SHPLONK,
    },
    utils::{keccak::decorator::RlcKeccakCircuitParams, snark_verifier::AggregationCircuitParams},
};
use axiom_eth::{
    rlc::circuit::RlcCircuitParams,
    snark_verifier_sdk::{halo2::gen_snark_shplonk, CircuitExt},
};
use ethers::providers::{JsonRpcClient, Provider};

use crate::{
    scaffold::{AxiomCircuit, AxiomCircuitScaffold},
    types::{AxiomCircuitParams, AxiomV2CircuitOutput, AxiomV2DataAndResults},
    utils::build_axiom_v2_compute_query,
};

pub fn create_aggregation_circuit(
    agg_circuit_params: AggregationCircuitParams,
    snark: Snark,
) -> AggregationCircuit {
    let params = gen_srs(agg_circuit_params.degree);
    let mut circuit = AggregationCircuit::new::<SHPLONK>(
        CircuitBuilderStage::Mock,
        agg_circuit_params,
        &params,
        [snark],
        VerifierUniversality::None,
    );
    circuit.expose_previous_instances(false);
    circuit
}

pub fn agg_circuit_mock(agg_circuit_params: AggregationCircuitParams, snark: Snark) {
    let circuit = create_aggregation_circuit(agg_circuit_params, snark);
    let instances = circuit.instances();
    MockProver::run(agg_circuit_params.degree, &circuit, instances)
        .unwrap()
        .assert_satisfied();
}

pub fn agg_circuit_keygen(
    agg_circuit_params: AggregationCircuitParams,
    snark: Snark,
) -> (VerifyingKey<G1Affine>, ProvingKey<G1Affine>) {
    let params = gen_srs(agg_circuit_params.degree);
    let circuit = create_aggregation_circuit(agg_circuit_params, snark);
    let vk = keygen_vk(&params, &circuit).expect("Failed to generate vk");
    let path = Path::new("data/agg_vk.bin");
    if let Some(parent) = path.parent() {
        create_dir_all(parent).expect("Failed to create data directory");
    }
    let mut vk_file = File::create(path).expect("Failed to create vk file");
    vk.write(&mut vk_file, SerdeFormat::RawBytesUnchecked)
        .expect("Failed to write vk");
    let pk = keygen_pk(&params, vk.clone(), &circuit).expect("Failed to generate pk");
    let path = Path::new("data/agg_pk.bin");
    let mut pk_file = File::create(path).expect("Failed to create pk file");
    pk.write(&mut pk_file, SerdeFormat::Processed)
        .expect("Failed to write pk");
    (vk, pk)
}

pub fn agg_circuit_prove(
    agg_circuit_params: AggregationCircuitParams,
    snark: Snark,
    pk: ProvingKey<G1Affine>,
) -> Snark {
    let params = gen_srs(agg_circuit_params.degree);
    let circuit = create_aggregation_circuit(agg_circuit_params, snark);
    gen_snark_shplonk(&params, &pk, circuit, None::<&str>)
}

pub fn keccak_circuit_run<P: JsonRpcClient + Clone, S: AxiomCircuitScaffold<P, Fr>>(
    provider: Provider<P>,
    raw_circuit_params: AxiomCircuitParams,
    inputs: Option<S::CircuitInput>,
    pk: ProvingKey<G1Affine>,
) -> (Snark, AxiomV2DataAndResults) {
    let circuit_params = RlcKeccakCircuitParams::from(raw_circuit_params.clone());
    let k = circuit_params.k();
    let params = gen_srs(k as u32);
    let mut runner = AxiomCircuit::<_, _, S>::new(provider, raw_circuit_params)
        .use_inputs(inputs.unwrap_or_default());
    let output = runner.scaffold_output();
    if circuit_params.keccak_rows_per_round > 0 {
        runner.calculate_params();
    }
    let snark = gen_snark_shplonk(&params, &pk, runner, None::<&str>);
    (snark, output)
}

pub fn agg_circuit_run(
    agg_circuit_params: AggregationCircuitParams,
    pk: ProvingKey<G1Affine>,
    inner_snark: Snark,
    inner_output: AxiomV2DataAndResults,
) -> AxiomV2CircuitOutput {
    let params = gen_srs(agg_circuit_params.degree);
    let circuit = create_aggregation_circuit(agg_circuit_params, inner_snark);
    let agg_circuit_params = circuit.builder.config_params.clone();
    let agg_snark = gen_snark_shplonk(&params, &pk, circuit, None::<&str>);
    let rlc_agg_circuit_params = RlcCircuitParams {
        base: agg_circuit_params,
        num_rlc_columns: 0,
    };
    let compute_query = build_axiom_v2_compute_query(
        agg_snark.clone(),
        rlc_agg_circuit_params,
        inner_output.clone(),
    );
    let output = AxiomV2CircuitOutput {
        compute_query,
        data: inner_output,
        snark: agg_snark,
    };
    let serialized = serde_json::to_string_pretty(&output).unwrap();
    let mut file = File::create("data/output.json").unwrap();
    file.write_all(serialized.as_bytes()).unwrap();
    output
}

use std::{
    fs::{create_dir_all, File},
    io::Write,
    path::Path,
};

use axiom_query::axiom_eth::{
    halo2_base::{
        gates::{circuit::CircuitBuilderStage, flex_gate::MultiPhaseThreadBreakPoints},
        utils::fs::gen_srs,
    },
    halo2_proofs::{
        dev::MockProver,
        plonk::{keygen_pk, keygen_vk, ProvingKey, VerifyingKey},
        SerdeFormat,
    },
    halo2curves::bn256::G1Affine,
    snark_verifier_sdk::{halo2::gen_snark_shplonk, CircuitExt, Snark},
    utils::snark_verifier::AggregationCircuitParams,
};

use crate::{
    aggregation::create_aggregation_circuit,
    types::{AxiomCircuitParams, AxiomV2CircuitOutput, AxiomV2DataAndResults},
    utils::build_axiom_v2_compute_query,
};

pub fn agg_circuit_mock(agg_circuit_params: AggregationCircuitParams, snark: Snark) {
    let circuit = create_aggregation_circuit(agg_circuit_params, snark, CircuitBuilderStage::Mock);
    let instances = circuit.instances();
    MockProver::run(agg_circuit_params.degree, &circuit, instances)
        .unwrap()
        .assert_satisfied();
}

pub fn agg_circuit_keygen(
    agg_circuit_params: AggregationCircuitParams,
    snark: Snark,
) -> (
    VerifyingKey<G1Affine>,
    ProvingKey<G1Affine>,
    MultiPhaseThreadBreakPoints,
) {
    let params = gen_srs(agg_circuit_params.degree);
    let circuit =
        create_aggregation_circuit(agg_circuit_params, snark, CircuitBuilderStage::Keygen);
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
    let breakpoints = circuit.break_points();
    (vk, pk, breakpoints)
}

pub fn agg_circuit_prove(
    agg_circuit_params: AggregationCircuitParams,
    snark: Snark,
    pk: ProvingKey<G1Affine>,
    break_points: MultiPhaseThreadBreakPoints,
) -> Snark {
    let params = gen_srs(agg_circuit_params.degree);
    let circuit =
        create_aggregation_circuit(agg_circuit_params, snark, CircuitBuilderStage::Prover);
    let circuit = circuit.use_break_points(break_points);
    gen_snark_shplonk(&params, &pk, circuit, None::<&str>)
}

pub fn agg_circuit_run(
    agg_circuit_params: AggregationCircuitParams,
    inner_snark: Snark,
    pk: ProvingKey<G1Affine>,
    break_points: MultiPhaseThreadBreakPoints,
    inner_output: AxiomV2DataAndResults,
) -> AxiomV2CircuitOutput {
    let params = gen_srs(agg_circuit_params.degree);
    let circuit =
        create_aggregation_circuit(agg_circuit_params, inner_snark, CircuitBuilderStage::Prover);
    let circuit = circuit.use_break_points(break_points);
    let agg_circuit_params = circuit.builder.config_params.clone();
    let agg_snark = gen_snark_shplonk(&params, &pk, circuit, None::<&str>);
    let compute_query = build_axiom_v2_compute_query(
        agg_snark.clone(),
        AxiomCircuitParams::Base(agg_circuit_params),
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

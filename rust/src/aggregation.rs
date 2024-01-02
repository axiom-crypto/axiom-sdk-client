use axiom_query::axiom_eth::{
    halo2_base::{gates::circuit::CircuitBuilderStage, utils::fs::gen_srs},
    snark_verifier_sdk::{
        halo2::aggregation::{AggregationCircuit, VerifierUniversality},
        Snark, SHPLONK,
    },
    utils::snark_verifier::AggregationCircuitParams,
};

pub fn create_aggregation_circuit(
    agg_circuit_params: AggregationCircuitParams,
    snark: Snark,
    stage: CircuitBuilderStage,
) -> AggregationCircuit {
    let params = gen_srs(agg_circuit_params.degree);
    let mut circuit = AggregationCircuit::new::<SHPLONK>(
        stage,
        agg_circuit_params,
        &params,
        [snark],
        VerifierUniversality::None,
    );
    circuit.expose_previous_instances(false);
    circuit
}






pub mod aggregation;
pub mod inner;

// pub struct AxiomCircuitRunner<P: JsonRpcClient, S: AxiomCircuitScaffold<P, Fr>> {
//     provider: Provider<P>,
//     raw_circuit_params: AxiomCircuitParams,
//     inputs: S::CircuitInput,
//     agg_circuit_params: Option<AggregationConfigParams>,
//     circuit: AxiomCircuit<Fr, P, S>,
// }

// impl<P: JsonRpcClient, S: AxiomCircuitScaffold<P, Fr>> AxiomCircuitRunner<P, S> {
//     pub fn new(provider: Provider<P>, raw_circuit_params: AxiomCircuitParams) -> Self {
//         Self {
//             provider,
//             raw_circuit_params,
//             inputs: Default::default(),
//             agg_circuit_params: None,
//             circuit: Default::default(),
//         }
//     }
// }

// pub fn mock<P: JsonRpcClient + Clone, S: AxiomCircuitScaffold<P, Fr>>(
//     provider: Provider<P>,
//     raw_circuit_params: AxiomCircuitParams,
//     inputs: Option<S::CircuitInput>,
// ) {
//     match raw_circuit_params {
//         AxiomCircuitParams::Base(_) => {
//             inner::rlc_circuit_mock::<_, S>(provider, raw_circuit_params, inputs);
//         }
//         AxiomCircuitParams::Rlc(_) => {
//             inner::rlc_circuit_mock::<_, S>(provider, raw_circuit_params, inputs);
//         }
//         AxiomCircuitParams::Keccak(_) => {
//             let (_, pk) = inner::rlc_circuit_keygen::<_, S>(provider.clone(), raw_circuit_params, inputs);
//             let snark = inner::rlc_circuit_prove::<_, S>(provider, raw_circuit_params, inputs, pk);
//             aggregation::agg_circuit_mock(agg_circuit_params, snark);
//         }
//     }
// }

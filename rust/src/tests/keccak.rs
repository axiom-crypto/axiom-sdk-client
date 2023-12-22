use crate::run::inner::mock;
use crate::scaffold::AxiomCircuitScaffold;
use crate::subquery::caller::SubqueryCaller;
use crate::tests::utils::MyCircuitInput;
use crate::tests::utils::MyCircuitVirtualInput;
use crate::tests::utils::{account_call, header_call};
use crate::types::AxiomCircuitParams;
use crate::utils::get_provider;
use crate::{ctx, witness};
use axiom_codec::HiLo;
use axiom_eth::rlc::circuit::RlcCircuitParams;
use axiom_eth::utils::keccak::decorator::RlcKeccakCircuitParams;
use axiom_eth::{
    halo2_base::{
        gates::{circuit::BaseCircuitParams, RangeChip},
        safe_types::SafeTypeChip,
        AssignedValue,
    },
    halo2curves::bn256::Fr,
    keccak::promise::KeccakFixLenCall,
    rlc::circuit::builder::RlcCircuitBuilder,
};
use ethers::providers::JsonRpcClient;
use std::sync::{Arc, Mutex};

macro_rules! keccak_test {
    ($subquery_call:ident) => {
        mod $subquery_call {
            use super::*;
            #[derive(Debug, Clone, Default)]
            struct TestStruct;
            impl<P: JsonRpcClient> AxiomCircuitScaffold<P, Fr> for TestStruct {
                type CircuitInput = MyCircuitInput;
                type VirtualCircuitInput = MyCircuitVirtualInput<Fr>;

                fn virtual_assign_phase0(
                    &self,
                    builder: &mut RlcCircuitBuilder<Fr>,
                    _range: &RangeChip<Fr>,
                    subquery_caller: Arc<Mutex<SubqueryCaller<P, Fr>>>,
                    callback: &mut Vec<HiLo<AssignedValue<Fr>>>,
                    _inputs: Self::VirtualCircuitInput,
                ) {
                    let val = $subquery_call(builder, subquery_caller.clone());
                    dbg!(val);
                    callback.push(val);
                    let a = witness!(builder, Fr::from(1));
                    let b = witness!(builder, Fr::from(2));
                    let bytes = SafeTypeChip::unsafe_to_fix_len_bytes_vec(vec![a, b], 2);
                    let keccak_call = KeccakFixLenCall::new(bytes);
                    let hilo = subquery_caller
                        .lock()
                        .unwrap()
                        .keccak(ctx!(builder, 0), keccak_call);
                    callback.push(hilo);
                }
            }

            #[test]
            fn test_circuit() {
                let base_params = BaseCircuitParams {
                    k: 12,
                    num_advice_per_phase: vec![4, 1],
                    num_lookup_advice_per_phase: vec![1, 1],
                    num_fixed: 1,
                    num_instance_columns: 1,
                    lookup_bits: Some(11),
                };
                let params = AxiomCircuitParams::Keccak(RlcKeccakCircuitParams {
                    keccak_rows_per_round: 20,
                    rlc: RlcCircuitParams {
                        base: base_params,
                        num_rlc_columns: 1,
                    },
                });
                let client = get_provider();
                let (_vk, pk) = keygen::<_, MyCircuit>(client.clone(), params.clone(), None);
                let output = run::<_, MyCircuit>(client, params, None, pk);
                let agg_circuit_params = AggregationConfigParams {
                    degree: 20,
                    num_advice: 23,
                    num_lookup_advice: 2,
                    num_fixed: 1,
                    lookup_bits: 19,
                };
                let (_, agg_pk, break_points) =
                    agg_circuit_keygen(agg_circuit_params, output.snark.clone());
                agg_circuit_run(
                    agg_circuit_params,
                    output.snark,
                    agg_pk,
                    break_points,
                    output.data,
                );
            }
        }
    };
}

keccak_test!(account_call);

keccak_test!(header_call);

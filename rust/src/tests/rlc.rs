
use crate::run::inner::mock;
use crate::subquery::caller::SubqueryCaller;
use crate::tests::utils::MyCircuitInput;
use crate::tests::utils::MyCircuitVirtualInput;
use crate::types::AxiomCircuitParams;
use crate::utils::get_provider;
use crate::scaffold::AxiomCircuitScaffold;
use axiom_codec::HiLo;
use axiom_eth::{
    halo2_base::{
        gates::{circuit::BaseCircuitParams, RangeChip},
        AssignedValue,
    },
    halo2curves::bn256::Fr,
    rlc::circuit::builder::RlcCircuitBuilder,
};
use ethers::providers::JsonRpcClient;
use crate::tests::utils::{account_call, header_call};
use std::sync::{Arc, Mutex};
use axiom_eth::rlc::circuit::RlcCircuitParams;

macro_rules! rlc_test {
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
                    let val = $subquery_call(builder, subquery_caller);
                    callback.push(val);
                }

            }

            #[test]
            fn test_circuit() {
                let params = BaseCircuitParams {
                    k: 12,
                    num_advice_per_phase: vec![4, 1],
                    num_lookup_advice_per_phase: vec![1, 1],
                    num_fixed: 1,
                    num_instance_columns: 1,
                    lookup_bits: Some(11),
                };
                let rlc_params = RlcCircuitParams {
                    base: params,
                    num_rlc_columns: 1,
                };
                let client = get_provider();
                mock::<_, TestStruct>(client, AxiomCircuitParams::Rlc(rlc_params), None);
            }
        }
    };
}

rlc_test!(account_call);

rlc_test!(header_call);

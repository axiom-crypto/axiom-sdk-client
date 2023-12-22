use crate::mock_test;
use crate::run::inner::mock;
use crate::scaffold::AxiomCircuit;
use crate::scaffold::AxiomCircuitScaffold;
use crate::single_instance_test;
use crate::subquery::caller::SubqueryCaller;
use crate::tests::utils::MyCircuitInput;
use crate::tests::utils::MyCircuitVirtualInput;
use crate::tests::utils::{account_call, header_call};
use crate::types::AxiomCircuitParams;
use crate::utils::get_provider;
use axiom_codec::types::field_elements::FieldSubqueryResult;
use axiom_codec::types::field_elements::SUBQUERY_RESULT_LEN;
use axiom_codec::HiLo;
use axiom_eth::rlc::circuit::RlcCircuitParams;
use axiom_eth::{
    halo2_base::{
        gates::{circuit::BaseCircuitParams, RangeChip},
        AssignedValue,
    },
    halo2curves::bn256::Fr,
    rlc::circuit::builder::RlcCircuitBuilder,
};
use ethers::providers::JsonRpcClient;
use std::sync::{Arc, Mutex};

macro_rules! rlc_test_struct {
    ($struct_name:ident, $subquery_call:ident) => {
        #[derive(Debug, Clone, Default)]
        struct $struct_name;
        impl<P: JsonRpcClient> AxiomCircuitScaffold<P, Fr> for $struct_name {
            type CircuitInput = MyCircuitInput;
            type VirtualCircuitInput = MyCircuitVirtualInput<Fr>;

            fn virtual_assign_phase0(
                &self,
                builder: &mut RlcCircuitBuilder<Fr>,
                _range: &RangeChip<Fr>,
                subquery_caller: Arc<Mutex<SubqueryCaller<P, Fr>>>,
                _callback: &mut Vec<HiLo<AssignedValue<Fr>>>,
                _inputs: Self::VirtualCircuitInput,
            ) {
                $subquery_call(builder, subquery_caller);
            }
        }
    };
}

fn get_rlc_test_params() -> AxiomCircuitParams {
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
    AxiomCircuitParams::Rlc(rlc_params)
}

mod account_tests {
    use super::*;
    rlc_test_struct!(AccountTest, account_call);
    mock_test!(AccountTest, get_rlc_test_params);
    single_instance_test!(AccountTest, get_rlc_test_params);
}

mod header_tests {
    use super::*;
    rlc_test_struct!(HeaderTest, header_call);
    mock_test!(HeaderTest, get_rlc_test_params);
    single_instance_test!(HeaderTest, get_rlc_test_params);
}

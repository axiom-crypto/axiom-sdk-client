use std::sync::{Arc, Mutex};

use axiom_codec::HiLo;
use axiom_eth::{
    halo2_base::{
        gates::{circuit::BaseCircuitParams, RangeChip},
        AssignedValue,
    },
    halo2curves::bn256::Fr,
    rlc::circuit::builder::RlcCircuitBuilder,
};
use ethers::providers::{Http, JsonRpcClient};
use test_case::test_case;

use super::utils::{
    all_subqueries_call, header_call, mapping_call, receipt_call, storage_call, tx_call,
};
use crate::{
    scaffold::AxiomCircuitScaffold,
    subquery::caller::SubqueryCaller,
    tests::{
        shared_tests::{mock_test, single_instance_test},
        utils::{account_call, MyCircuitInput, MyCircuitVirtualInput},
    },
    types::AxiomCircuitParams,
};

macro_rules! base_test_struct {
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

fn get_base_test_params() -> AxiomCircuitParams {
    let params = BaseCircuitParams {
        k: 12,
        num_advice_per_phase: vec![4],
        num_lookup_advice_per_phase: vec![1],
        num_fixed: 1,
        num_instance_columns: 1,
        lookup_bits: Some(11),
    };
    AxiomCircuitParams::Base(params)
}

base_test_struct!(AccountTest, account_call);
base_test_struct!(HeaderTest, header_call);
base_test_struct!(ReceiptTest, receipt_call);
base_test_struct!(StorageTest, storage_call);
base_test_struct!(MappingTest, mapping_call);
base_test_struct!(TxTest, tx_call);
base_test_struct!(AllSubqueryTest, all_subqueries_call);

#[test_case(AccountTest)]
#[test_case(HeaderTest)]
#[test_case(ReceiptTest)]
#[test_case(StorageTest)]
#[test_case(MappingTest)]
#[test_case(TxTest)]
#[test_case(AllSubqueryTest)]
pub fn mock<S: AxiomCircuitScaffold<Http, Fr>>(circuit: S) {
    let params = get_base_test_params();
    mock_test(params, circuit);
}

#[test_case(AccountTest)]
#[test_case(HeaderTest)]
#[test_case(ReceiptTest)]
#[test_case(StorageTest)]
#[test_case(MappingTest)]
#[test_case(TxTest)]
pub fn single_instance<S: AxiomCircuitScaffold<Http, Fr>>(circuit: S) {
    let params = get_base_test_params();
    single_instance_test(params, circuit);
}

use crate::run::aggregation::{agg_circuit_keygen, agg_circuit_mock, agg_circuit_run};
use crate::run::inner::{keygen, prove, run};
use crate::scaffold::AxiomCircuitScaffold;
use crate::subquery::caller::SubqueryCaller;
use crate::tests::utils::MyCircuitInput;
use crate::tests::utils::MyCircuitVirtualInput;
use crate::tests::utils::{account_call, header_call};
use crate::types::AxiomCircuitParams;
use crate::utils::get_provider;
use crate::{ctx, witness};
use axiom_codec::HiLo;
use axiom_eth::keccak;
use axiom_eth::rlc::circuit::RlcCircuitParams;
use axiom_eth::snark_verifier_sdk::halo2::aggregation::AggregationConfigParams;
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
use ethers::providers::{Http, JsonRpcClient};
use std::sync::{Arc, Mutex};
use test_case::test_case;

use super::utils::{receipt_call, storage_call, mapping_call, tx_call, all_subqueries_call};

macro_rules! keccak_test_struct {
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
                $subquery_call(builder, subquery_caller.clone());
                let a = witness!(builder, Fr::from(1));
                let b = witness!(builder, Fr::from(2));
                let bytes = SafeTypeChip::unsafe_to_fix_len_bytes_vec(vec![a, b], 2);
                let keccak_call = KeccakFixLenCall::new(bytes);
                subquery_caller
                    .lock()
                    .unwrap()
                    .keccak(ctx!(builder, 0), keccak_call);
            }
        }
    };
}

fn get_keccak_test_params() -> AxiomCircuitParams {
    let params = BaseCircuitParams {
        k: 12,
        num_advice_per_phase: vec![4],
        num_lookup_advice_per_phase: vec![1],
        num_fixed: 1,
        num_instance_columns: 1,
        lookup_bits: Some(11),
    };
    let rlc_params = RlcCircuitParams {
        base: params,
        num_rlc_columns: 1,
    };
    AxiomCircuitParams::Keccak(RlcKeccakCircuitParams {
        keccak_rows_per_round: 20,
        rlc: rlc_params,
    })
}

keccak_test_struct!(AccountTest, account_call);
keccak_test_struct!(HeaderTest, header_call);
keccak_test_struct!(ReceiptTest, receipt_call);
keccak_test_struct!(StorageTest, storage_call);
keccak_test_struct!(MappingTest, mapping_call);
keccak_test_struct!(TxTest, tx_call);
keccak_test_struct!(AllSubqueryTest, all_subqueries_call);

#[test_case(AccountTest)]
#[test_case(HeaderTest)]
#[test_case(ReceiptTest)]
#[test_case(StorageTest)]
#[test_case(MappingTest)]
#[test_case(TxTest)]
#[test_case(AllSubqueryTest)]
pub fn mock<S: AxiomCircuitScaffold<Http, Fr>>(_circuit: S) {
    let params = get_keccak_test_params();
    let agg_circuit_params = AggregationConfigParams {
        degree: 20,
        num_advice: 23,
        num_lookup_advice: 2,
        num_fixed: 1,
        lookup_bits: 19,
    };
    let client = get_provider();
    let (_, pk) = keygen::<_, S>(client.clone(), params.clone(), None);
    let snark = prove::<_, S>(client, params, None, pk);
    agg_circuit_mock(agg_circuit_params, snark);
}

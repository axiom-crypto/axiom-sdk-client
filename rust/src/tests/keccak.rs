use std::sync::{Arc, Mutex};

use axiom_codec::HiLo;
use axiom_query::{
    axiom_eth::{
        halo2_base::{
            gates::{
                circuit::{BaseCircuitParams, CircuitBuilderStage},
                RangeChip,
            },
            safe_types::SafeTypeChip,
            utils::fs::gen_srs,
            AssignedValue,
        },
        halo2_proofs::poly::commitment::ParamsProver,
        halo2curves::bn256::Fr,
        keccak::promise::KeccakFixLenCall,
        rlc::circuit::{builder::RlcCircuitBuilder, RlcCircuitParams},
        snark_verifier_sdk::{halo2::aggregation::AggregationConfigParams, CircuitExt},
        utils::keccak::decorator::RlcKeccakCircuitParams,
    },
    verify_compute::utils::verify_snark,
};
use ethers::providers::{Http, JsonRpcClient};
use test_case::test_case;

use super::{
    shared_tests::{check_compute_proof_format, check_compute_query_format, single_instance_test},
    utils::{all_subqueries_call, mapping_call, receipt_call, storage_call, tx_call},
};
use crate::{
    aggregation::create_aggregation_circuit,
    ctx,
    run::{
        aggregation::{agg_circuit_keygen, agg_circuit_mock, agg_circuit_run},
        inner::{keygen, prove, run},
    },
    scaffold::{AxiomCircuit, AxiomCircuitScaffold},
    subquery::caller::SubqueryCaller,
    tests::utils::{account_call, header_call, MyCircuitInput, MyCircuitVirtualInput},
    types::AxiomCircuitParams,
    utils::get_provider,
    witness,
};

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
    let base_params = BaseCircuitParams {
        k: 13,
        num_advice_per_phase: vec![4],
        num_lookup_advice_per_phase: vec![1],
        num_fixed: 1,
        num_instance_columns: 1,
        lookup_bits: Some(12),
    };
    AxiomCircuitParams::Keccak(RlcKeccakCircuitParams {
        keccak_rows_per_round: 20,
        rlc: RlcCircuitParams {
            base: base_params.clone(),
            num_rlc_columns: 0,
        },
    })
}

fn get_agg_test_params() -> AggregationConfigParams {
    AggregationConfigParams {
        degree: 20,
        num_advice: 23,
        num_lookup_advice: 2,
        num_fixed: 1,
        lookup_bits: 19,
    }
}

keccak_test_struct!(AccountTest, account_call);
keccak_test_struct!(HeaderTest, header_call);
keccak_test_struct!(ReceiptTest, receipt_call);
keccak_test_struct!(StorageTest, storage_call);
keccak_test_struct!(MappingTest, mapping_call);
keccak_test_struct!(TxTest, tx_call);
keccak_test_struct!(AllSubqueryTest, all_subqueries_call);

// #[test_case(AccountTest)]
// #[test_case(HeaderTest)]
// #[test_case(ReceiptTest)]
// #[test_case(StorageTest)]
// #[test_case(MappingTest)]
// #[test_case(TxTest)]
#[test_case(AllSubqueryTest)]
pub fn mock<S: AxiomCircuitScaffold<Http, Fr>>(_circuit: S) {
    let params = get_keccak_test_params();
    let agg_circuit_params = get_agg_test_params();
    let client = get_provider();
    let (_, pk) = keygen::<_, S>(client.clone(), params.clone(), None);
    let snark = prove::<_, S>(client, params, None, pk);
    agg_circuit_mock(agg_circuit_params, snark);
}

#[test_case(AccountTest)]
#[test_case(HeaderTest)]
#[test_case(ReceiptTest)]
#[test_case(StorageTest)]
#[test_case(MappingTest)]
#[test_case(TxTest)]
pub fn test_single_subquery_instances<S: AxiomCircuitScaffold<Http, Fr>>(_circuit: S) {
    let params = get_keccak_test_params();
    let agg_circuit_params = get_agg_test_params();
    let client = get_provider();
    let runner = AxiomCircuit::<_, _, S>::new(client.clone(), params.clone());
    let num_user_output_fe = runner.output_num_instances();
    let subquery_fe = runner.subquery_num_instances();
    let results = runner.scaffold_output();
    let (_, pk) = keygen::<_, S>(client.clone(), params.clone(), None);
    let snark = prove::<_, S>(client, params, None, pk);
    let agg_circuit =
        create_aggregation_circuit(agg_circuit_params, snark.clone(), CircuitBuilderStage::Mock);
    let instances = agg_circuit.instances();
    single_instance_test(
        instances,
        num_user_output_fe,
        subquery_fe,
        results,
        Some(snark),
    );
}

// #[test_case(AccountTest)]
// #[test_case(HeaderTest)]
// #[test_case(ReceiptTest)]
// #[test_case(StorageTest)]
// #[test_case(MappingTest)]
// #[test_case(TxTest)]
#[test_case(AllSubqueryTest)]
pub fn test_compute_query<S: AxiomCircuitScaffold<Http, Fr>>(_circuit: S) {
    let params = get_keccak_test_params();
    let agg_circuit_params = get_agg_test_params();
    let client = get_provider();
    let (_vk, pk) = keygen::<_, S>(client.clone(), params.clone(), None);
    let output = run::<_, S>(client, params.clone(), None, pk);
    let (agg_vk, agg_pk, break_points) =
        agg_circuit_keygen(agg_circuit_params, output.snark.clone());
    let final_output = agg_circuit_run(
        agg_circuit_params,
        output.snark.clone(),
        agg_pk,
        break_points,
        output.data,
    );
    let circuit = create_aggregation_circuit(
        agg_circuit_params,
        output.snark.clone(),
        CircuitBuilderStage::Prover,
    );
    check_compute_proof_format(final_output.clone(), true);
    check_compute_query_format(
        final_output.clone(),
        AxiomCircuitParams::Base(circuit.builder.config_params),
        agg_vk,
    );
    // TEMP
    let kzg_params = gen_srs(agg_circuit_params.degree);
    let dk = (kzg_params.get_g()[0], kzg_params.g2(), kzg_params.s_g2());
    verify_snark(&dk.into(), &final_output.snark).unwrap();
}

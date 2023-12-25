use std::{
    borrow::BorrowMut,
    sync::{Arc, Mutex},
};

use axiom_codec::HiLo;
use axiom_eth::{
    halo2_base::{
        gates::{
            circuit::BaseCircuitParams, GateChip, GateInstructions, RangeChip, RangeInstructions,
        },
        safe_types::SafeTypeChip,
        AssignedValue, Context,
    },
    halo2curves::bn256::Fr,
    keccak::promise::KeccakFixLenCall,
    rlc::circuit::{builder::RlcCircuitBuilder, RlcCircuitParams},
    snark_verifier_sdk::halo2::aggregation::AggregationConfigParams,
    utils::keccak::decorator::RlcKeccakCircuitParams,
    Field,
};
use ethers::providers::JsonRpcClient;

use crate::{
    constant, ctx,
    run::{
        aggregation::{agg_circuit_keygen, agg_circuit_run},
        inner::{keygen, mock, prove, run},
    },
    scaffold::{AxiomCircuitScaffold, RawCircuitInput},
    subquery::{caller::SubqueryCaller, header::HeaderField, types::AssignedHeaderSubquery},
    types::AxiomCircuitParams,
    utils::get_provider,
    witness,
};

#[derive(Debug, Clone, Default)]
struct MyCircuitInput {
    a: u64,
    b: u64,
}

#[derive(Debug, Clone)]
struct MyCircuitVirtualInput<F: Field> {
    a: AssignedValue<F>,
    b: AssignedValue<F>,
}

impl RawCircuitInput<Fr, MyCircuitVirtualInput<Fr>> for MyCircuitInput {
    fn assign(&self, ctx: &mut Context<Fr>) -> MyCircuitVirtualInput<Fr> {
        let a = ctx.load_witness(Fr::from(self.a));
        let b = ctx.load_witness(Fr::from(self.b));
        MyCircuitVirtualInput { a, b }
    }
}

#[derive(Debug, Clone, Default)]
struct MyCircuit;
impl<P: JsonRpcClient> AxiomCircuitScaffold<P, Fr> for MyCircuit {
    type CircuitInput = MyCircuitInput;
    type VirtualCircuitInput = MyCircuitVirtualInput<Fr>;

    fn virtual_assign_phase0(
        &self,
        builder: &mut RlcCircuitBuilder<Fr>,
        range: &RangeChip<Fr>,
        subquery_caller: Arc<Mutex<SubqueryCaller<P, Fr>>>,
        callback: &mut Vec<HiLo<AssignedValue<Fr>>>,
        inputs: Self::VirtualCircuitInput,
    ) {
        let gate = GateChip::<Fr>::new();
        gate.add(ctx!(builder, 0), inputs.a, inputs.b);
        let bytes = SafeTypeChip::unsafe_to_fix_len_bytes_vec(vec![inputs.b, inputs.b], 2);
        let keccak_call = KeccakFixLenCall::new(bytes);
        let hilo = subquery_caller
            .lock()
            .unwrap()
            .keccak(ctx!(builder, 0), keccak_call);
        callback.push(hilo);
        range.range_check(ctx!(builder, 0), inputs.a, 10);
        let subquery = AssignedHeaderSubquery {
            block_number: witness!(builder, Fr::from(9730000)),
            field_idx: constant!(builder, Fr::from(HeaderField::GasLimit)),
        };
        let timestamp = subquery_caller
            .lock()
            .unwrap()
            .call(ctx!(builder, 0), subquery);
        callback.push(timestamp);
    }

    fn virtual_assign_phase1(
        &self,
        builder: &mut RlcCircuitBuilder<Fr>,
        _range: &RangeChip<Fr>,
        _payload: Self::FirstPhasePayload,
    ) {
        let _gate = GateChip::<Fr>::new();
        builder.base.borrow_mut().main(1).load_witness(Fr::from(1));
        dbg!(builder.gamma.unwrap_or(Fr::from(0)));
    }
}

#[test]
pub fn test_keygen() {
    let params = BaseCircuitParams {
        k: 13,
        num_advice_per_phase: vec![4],
        num_lookup_advice_per_phase: vec![1],
        num_fixed: 1,
        num_instance_columns: 1,
        lookup_bits: Some(12),
    };
    let client = get_provider();
    keygen::<_, MyCircuit>(client, AxiomCircuitParams::Base(params), None);
}

#[test]
pub fn test_mock() {
    let params = BaseCircuitParams {
        k: 12,
        num_advice_per_phase: vec![4],
        num_lookup_advice_per_phase: vec![1],
        num_fixed: 1,
        num_instance_columns: 1,
        lookup_bits: Some(11),
    };
    let client = get_provider();
    mock::<_, MyCircuit>(client, AxiomCircuitParams::Base(params), None);
}

#[test]
pub fn test_prove() {
    let params = BaseCircuitParams {
        k: 13,
        num_advice_per_phase: vec![4],
        num_lookup_advice_per_phase: vec![1],
        num_fixed: 1,
        num_instance_columns: 1,
        lookup_bits: Some(12),
    };
    let client = get_provider();
    let (_, pk) = keygen::<_, MyCircuit>(
        client.clone(),
        AxiomCircuitParams::Base(params.clone()),
        None,
    );
    prove::<_, MyCircuit>(client, AxiomCircuitParams::Base(params), None, pk);
}

#[test]
pub fn test_run() {
    let params = BaseCircuitParams {
        k: 13,
        num_advice_per_phase: vec![4, 1],
        num_lookup_advice_per_phase: vec![1, 1],
        num_fixed: 1,
        num_instance_columns: 1,
        lookup_bits: Some(12),
    };
    let client = get_provider();
    let (_vk, pk) = keygen::<_, MyCircuit>(
        client.clone(),
        AxiomCircuitParams::Rlc(RlcCircuitParams {
            base: params.clone(),
            num_rlc_columns: 1,
        }),
        None,
    );
    run::<_, MyCircuit>(
        client,
        AxiomCircuitParams::Rlc(RlcCircuitParams {
            base: params.clone(),
            num_rlc_columns: 1,
        }),
        None,
        pk,
    );
}

#[test]
pub fn test_aggregation() {
    let base_params = BaseCircuitParams {
        k: 13,
        num_advice_per_phase: vec![4, 1],
        num_lookup_advice_per_phase: vec![1, 1],
        num_fixed: 1,
        num_instance_columns: 1,
        lookup_bits: Some(12),
    };
    let params = AxiomCircuitParams::Keccak(RlcKeccakCircuitParams {
        keccak_rows_per_round: 20,
        rlc: RlcCircuitParams {
            base: base_params.clone(),
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
    let (_, agg_pk, break_points) = agg_circuit_keygen(agg_circuit_params, output.snark.clone());
    agg_circuit_run(
        agg_circuit_params,
        output.snark,
        agg_pk,
        break_points,
        output.data,
    );
}

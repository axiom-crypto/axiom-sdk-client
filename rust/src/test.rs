use std::borrow::BorrowMut;

use crate::{
    constant, ctx,
    run::{keygen, mock, prove, run},
    scaffold::{AxiomCircuitScaffold, RawCircuitInput},
    subquery::{caller::SubqueryCaller, header::HeaderField, types::AssignedHeaderSubquery},
    utils::get_provider,
    witness, types::AxiomCircuitParams,
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
    rlc::circuit::builder::RlcCircuitBuilder,
    Field,
};
use ethers::providers::JsonRpcClient;

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
        subquery_caller: &mut SubqueryCaller<P, Fr>,
        callback: &mut Vec<HiLo<AssignedValue<Fr>>>,
        inputs: Self::VirtualCircuitInput,
    ) {
        let gate = GateChip::<Fr>::new();
        gate.add(ctx!(builder, 0), inputs.a, inputs.b);
        let bytes = SafeTypeChip::unsafe_to_fix_len_bytes_vec(vec![inputs.b, inputs.b], 2);
        let _keccak_call = KeccakFixLenCall::new(bytes);
        // let hilo = subquery_caller.keccak(ctx!(builder, 0), keccak_call);
        // callback.push(hilo);
        range.range_check(ctx!(builder, 0), inputs.a, 10);
        let subquery = AssignedHeaderSubquery {
            block_number: witness!(builder, Fr::from(9730000)),
            field_idx: constant!(builder, Fr::from(HeaderField::GasLimit)),
        };
        let timestamp = subquery_caller.call(ctx!(builder, 0), subquery);
        callback.push(timestamp);
    }
}

#[test]
pub fn test_keygen() {
    let params = BaseCircuitParams {
        k: 13,
        num_advice_per_phase: vec![4, 0, 0],
        num_lookup_advice_per_phase: vec![1, 0, 0],
        num_fixed: 1,
        num_instance_columns: 1,
        lookup_bits: Some(12),
    };
    let client = get_provider();
    keygen::<_, MyCircuit>(client, AxiomCircuitParams::Base(params));
}

#[test]
pub fn test_mock() {
    let params = BaseCircuitParams {
        k: 12,
        num_advice_per_phase: vec![4, 0, 0],
        num_lookup_advice_per_phase: vec![1, 0, 0],
        num_fixed: 1,
        num_instance_columns: 1,
        lookup_bits: Some(11),
    };
    let client = get_provider();
    mock::<_, MyCircuit>(client, AxiomCircuitParams::Base(params));
}

#[test]
pub fn test_prove() {
    let params = BaseCircuitParams {
        k: 13,
        num_advice_per_phase: vec![4, 0, 0],
        num_lookup_advice_per_phase: vec![1, 0, 0],
        num_fixed: 1,
        num_instance_columns: 1,
        lookup_bits: Some(12),
    };
    let client = get_provider();
    let (_, pk) = keygen::<_, MyCircuit>(client.clone(), AxiomCircuitParams::Base(params.clone()));
    prove::<_, MyCircuit>(client, AxiomCircuitParams::Base(params), pk);
}

#[test]
pub fn test_run() {
    let params = BaseCircuitParams {
        k: 13,
        num_advice_per_phase: vec![4, 0, 0],
        num_lookup_advice_per_phase: vec![1, 0, 0],
        num_fixed: 1,
        num_instance_columns: 1,
        lookup_bits: Some(12),
    };
    let client = get_provider();
    let (_vk, pk) = keygen::<_, MyCircuit>(client.clone(), AxiomCircuitParams::Base(params.clone()));
    run::<_, MyCircuit>(client, AxiomCircuitParams::Base(params), pk);
}

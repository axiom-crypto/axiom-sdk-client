use std::{borrow::BorrowMut, env, marker::PhantomData};

use crate::{
    run::{keygen, mock, prove},
    scaffold::{AxiomCircuitScaffold, RawCircuitInput},
    subquery::{caller::SubqueryCaller, types::{AssignedHeaderSubquery, AssignedHiLo}},
};
use axiom_eth::{
    halo2_base::{
        gates::{circuit::BaseCircuitParams, GateChip, GateInstructions, RangeChip},
        AssignedValue, Context,
    },
    halo2curves::bn256::Fr,
    rlc::circuit::builder::RlcCircuitBuilder,
    Field,
};
use dotenv::dotenv;
use ethers::providers::{Http, JsonRpcClient, Provider};

#[derive(Debug, Clone)]
struct MyCircuitInput {
    a: u64,
    b: u64,
}

#[derive(Debug, Clone)]
struct MyCircuitVirtualInput<F: Field> {
    a: u64,
    b: u64,
    c: PhantomData<F>
}

impl RawCircuitInput<Fr, MyCircuitVirtualInput<Fr>> for MyCircuitInput {
    fn default() -> Self {
        MyCircuitInput { a: 1, b: 1 }
    }

    fn assign(&self, ctx: &mut Context<Fr>) -> MyCircuitVirtualInput<Fr> {
        MyCircuitVirtualInput { a: self.a , b: self.b, c: PhantomData }
    }
}

#[derive(Debug, Clone)]
struct MyCircuit;
impl<P: JsonRpcClient> AxiomCircuitScaffold<P, Fr> for MyCircuit {
    type CircuitInput = MyCircuitInput;
    type VirtualCircuitInput = MyCircuitVirtualInput<Fr>;
    type FirstPhasePayload = ();

    fn virtual_assign_phase0(
        &self,
        builder: &mut RlcCircuitBuilder<Fr>,
        _range: &RangeChip<Fr>,
        subquery_caller: &mut SubqueryCaller<P, Fr>,
        callback: &mut Vec<AssignedHiLo<Fr>>,
        inputs: Self::VirtualCircuitInput,
    ) -> Self::FirstPhasePayload {
        let gate = GateChip::<Fr>::new();
        // gate.add(builder.base.borrow_mut().main(0), inputs.a, inputs.b);
        let a = builder.base.borrow_mut().main(0).load_witness(Fr::from(1));
        let b = builder.base.borrow_mut().main(0).load_witness(Fr::from(1));
        let c = gate.add(builder.base.borrow_mut().main(0), a, b);
        // let block_number = builder
        //     .base
        //     .borrow_mut()
        //     .main(0)
        //     .load_witness(Fr::from(9730000));
        // let field_idx = builder.base.borrow_mut().main(0).load_constant(Fr::from(11));
        // let subquery = AssignedHeaderSubquery {
        //     block_number,
        //     field_idx,
        // };
        // let timestamp = subquery_caller.call(builder.base.borrow_mut().main(0), subquery);
        // callback.push(timestamp);
    }
}

#[test]
pub fn test_keygen() {
    dotenv().ok();
    let circuit = MyCircuit;
    let params = BaseCircuitParams {
        k: 13,
        num_advice_per_phase: vec![4, 0, 0],
        num_lookup_advice_per_phase: vec![1, 0, 0],
        num_fixed: 1,
        num_instance_columns: 1,
        lookup_bits: Some(12),
    };
    let client = Provider::<Http>::try_from(env::var("PROVIDER_URI").unwrap()).unwrap();
    keygen(circuit, client, params, None);
}

#[test]
pub fn test_mock() {
    dotenv().ok();
    let circuit = MyCircuit;
    let params = BaseCircuitParams {
        k: 12,
        num_advice_per_phase: vec![4, 0, 0],
        num_lookup_advice_per_phase: vec![1, 0, 0],
        num_fixed: 1,
        num_instance_columns: 1,
        lookup_bits: Some(11),
    };
    let client = Provider::<Http>::try_from(env::var("PROVIDER_URI").unwrap()).unwrap();
    mock(circuit, client, params, None);
}

#[test]
pub fn test_prove() {
    dotenv().ok();
    let circuit = MyCircuit;
    let params = BaseCircuitParams {
        k: 12,
        num_advice_per_phase: vec![4, 0, 0],
        num_lookup_advice_per_phase: vec![1, 0, 0],
        num_fixed: 1,
        num_instance_columns: 1,
        lookup_bits: Some(11),
    };
    let client = Provider::<Http>::try_from(env::var("PROVIDER_URI").unwrap()).unwrap();
    let pk = keygen(circuit.clone(), client.clone(), params.clone(), None);
    prove(circuit, client, params, None, pk);
}

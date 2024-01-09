use std::{
    fmt::Debug,
    sync::{Arc, Mutex},
};

use axiom_client::{
    axiom_eth::halo2_base::{
        gates::{GateChip, GateInstructions, RangeChip},
        AssignedValue, Context,
    },
    subquery::caller::SubqueryCaller,
};
use axiom_client_derive::AxiomComputeInput;
use ethers::providers::Http;

use crate::{
    compute::{AxiomComputeFn, AxiomResult},
    subquery::header::get_header,
    Fr,
};

#[cfg(test)]
mod tests;

mod account_age;

#[AxiomComputeInput]
pub struct MyInput {
    pub a: u32,
    pub b: u32,
}

impl AxiomComputeFn for MyInput {
    fn compute(
        ctx: &mut Context<Fr>,
        _range: &RangeChip<Fr>,
        caller: Arc<Mutex<SubqueryCaller<Http, Fr>>>,
        assigned_inputs: MyCircuitInput<AssignedValue<Fr>>,
    ) -> Vec<AxiomResult> {
        let gate = GateChip::new();
        let res = gate.add(ctx, assigned_inputs.a, assigned_inputs.b);
        get_header(ctx, caller.clone(), assigned_inputs.a);
        get_header(ctx, caller, assigned_inputs.a);
        vec![res.into()]
    }
}

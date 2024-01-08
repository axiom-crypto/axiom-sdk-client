use std::fmt::Debug;

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
    Fr,
};

#[cfg(test)]
mod tests;

#[AxiomComputeInput]
pub struct MyInput {
    pub a: u32,
    pub b: u32,
}

impl AxiomComputeFn for MyInput {
    fn compute(
        ctx: &mut Context<Fr>,
        _range: &RangeChip<Fr>,
        _caller: &SubqueryCaller<Http, Fr>,
        assigned_inputs: MyCircuitInput<AssignedValue<Fr>>,
    ) -> Vec<AxiomResult> {
        let gate = GateChip::new();
        let res = gate.add(ctx, assigned_inputs.a, assigned_inputs.b);
        vec![res.into()]
    }
}

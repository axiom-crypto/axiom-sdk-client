use axiom_client::{axiom_eth::{halo2_base::{Context, gates::RangeChip, AssignedValue}, utils::hilo::HiLo}, subquery::caller::SubqueryCaller};
use axiom_client_derive::AxiomComputeInput;
use axiom_client::input::raw_input::RawInput;
use ethers::providers::{Provider, Http};
use crate::Fr;

#[AxiomComputeInput]
pub struct MyInput<const N: usize> {
    pub a: u32,
    pub b: u32,
}

fn main() {
    let x: MyInput<2> = MyInput { a: 1, b: 2 };
    x.clone();
    let _w: MyCircuitInput<Fr, 2> = x.convert();
    let _x: MyCircuitInput<Fr, 2> = MyCircuitInput {
        a: Fr::from(1),
        b: Fr::from(2),
    };
}

// impl AxiomCompute 

fn compute(
    ctx: &mut Context<Fr>,
    range: &RangeChip<Fr>,
    caller: &SubqueryCaller<Http, Fr>,
    assigned_inputs: MyCircuitInput<AssignedValue<Fr>, 2>,
) -> Vec<HiLo<AssignedValue<Fr>>> {
    todo!()
}
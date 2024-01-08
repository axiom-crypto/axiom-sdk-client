use std::env;

use axiom_client::axiom_eth::halo2_base::gates::circuit::BaseCircuitParams;
use ethers::providers::Provider;
use lazy_static::lazy_static;

use super::*;
use crate::compute::AxiomCompute;

lazy_static! {
    pub static ref PARAMS: BaseCircuitParams = BaseCircuitParams {
        k: 12,
        num_advice_per_phase: vec![4],
        num_fixed: 1,
        num_lookup_advice_per_phase: vec![1],
        lookup_bits: Some(11),
        num_instance_columns: 1,
    };
    pub static ref INPUTS: MyInput = MyInput { a: 1, b: 2 };
}

fn provider() -> Provider<Http> {
    Provider::<Http>::try_from(env::var("PROVIDER_URI").expect("PROVIDER_URI not set")).unwrap()
}

#[test]
fn mock() {
    AxiomCompute::<MyInput>::new()
        .use_inputs(INPUTS.clone())
        .use_params(PARAMS.clone())
        .use_provider(provider())
        .mock();
}

#[test]
fn keygen() {
    AxiomCompute::<MyInput>::new()
        .use_inputs(INPUTS.clone())
        .use_params(PARAMS.clone())
        .use_provider(provider())
        .keygen();
}

#[test]
fn prove() {
    let compute = AxiomCompute::<MyInput>::new()
        .use_params(PARAMS.clone())
        .use_provider(provider());
    let (_vk, pk) = compute.keygen();
    compute.use_inputs(INPUTS.clone()).prove(pk);
}

#[test]
fn run() {
    let compute = AxiomCompute::<MyInput>::new()
        .use_params(PARAMS.clone())
        .use_provider(provider());
    let (_vk, pk) = compute.keygen();
    compute.use_inputs(INPUTS.clone()).run(pk);
}

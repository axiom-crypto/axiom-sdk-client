use axiom_client::axiom_eth::halo2curves::grumpkin::Fr;
use axiom_client_derive::AxiomComputeInput;

#[AxiomComputeInput]
pub struct MyInput {
    pub a: u32,
    pub b: u32,
}

fn main() {
    let _x: MyInput = MyInput { a: 1, b: 2 };
    let _x: MyCircuitInput<Fr> = MyCircuitInput {
        a: Fr::from(1),
        b: Fr::from(2),
    };
}

use axiom_client::axiom_eth::halo2curves::grumpkin::Fr;
use axiom_client_derive::AxiomComputeInput;
use axiom_client::input::raw_input::RawInput;

#[AxiomComputeInput]
pub struct MyInput<const N: usize> {
    pub a: u32,
    pub b: u32,
}

fn main() {
    let _x: MyInput<3> = MyInput { a: 1, b: 2 };
    let _w: MyCircuitInput<Fr, 3> = _x.convert();
    // let _x: MyCircuitInput<Fr> = MyCircuitInput {
    //     a: Fr::from(1),
    //     b: Fr::from(2),
    // };
}

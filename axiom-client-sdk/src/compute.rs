use std::{
    fmt::Debug,
    marker::PhantomData,
    sync::{Arc, Mutex},
};

use axiom_client::{
    axiom_eth::{
        halo2_base::{gates::RangeChip, AssignedValue, Context},
        rlc::circuit::builder::RlcCircuitBuilder,
        utils::hilo::HiLo,
        Field,
    },
    input::flatten::InputFlatten,
    scaffold::AxiomCircuitScaffold,
    subquery::caller::SubqueryCaller,
};
use ethers::providers::{Http, JsonRpcClient};

pub trait AxiomScaffoldInput<F: Field>: Clone + Default + Debug {
    type LogicInput: Clone + Debug + Into<Self::Input<F>>;
    type Input<T: Copy>: Clone + Debug + Default + InputFlatten<T>;
    type Provider: JsonRpcClient + Clone = Http;
    fn compute(
        ctx: &mut Context<F>,
        range: &RangeChip<F>,
        caller: &SubqueryCaller<Self::Provider, F>,
        assigned_inputs: Self::Input<AssignedValue<F>>,
    ) -> Vec<HiLo<AssignedValue<F>>>;
}

#[derive(Debug, Clone, Default)]
pub struct AxiomScaffoldInputImpl<F: Field, A: AxiomScaffoldInput<F>>(PhantomData<(A, F)>);

impl<F: Field, A: AxiomScaffoldInput<F>> AxiomCircuitScaffold<A::Provider, F>
    for AxiomScaffoldInputImpl<F, A>
{
    type InputValue = A::Input<F>;
    type InputWitness = A::Input<AssignedValue<F>>;

    fn virtual_assign_phase0(
        builder: &mut RlcCircuitBuilder<F>,
        range: &RangeChip<F>,
        subquery_caller: Arc<Mutex<SubqueryCaller<A::Provider, F>>>,
        callback: &mut Vec<HiLo<AssignedValue<F>>>,
        assigned_inputs: Self::InputWitness,
    ) {
        let ctx = builder.base.main(0);
        let caller = subquery_caller.lock().unwrap();
        let result = A::compute(&mut ctx.clone(), range, &caller, assigned_inputs);
        callback.extend(result);
    }
}

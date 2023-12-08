use axiom_eth::halo2_base::gates::circuit::{BaseCircuitParams, BaseConfig};
use axiom_eth::halo2_base::virtual_region::manager::VirtualRegionManager;
use axiom_eth::halo2_base::Context;
use axiom_eth::rlc::circuit::RlcCircuitParams;
use axiom_eth::snark_verifier_sdk::CircuitExt;
use axiom_eth::utils::DEFAULT_RLC_CACHE_BITS;
use axiom_eth::Field;
use axiom_eth::{
    halo2_base::gates::RangeChip,
    halo2_proofs::{
        circuit::{Layouter, SimpleFloorPlanner},
        plonk::Error,
        plonk::{Circuit, ConstraintSystem},
    },
    rlc::circuit::{builder::RlcCircuitBuilder, RlcConfig},
};
use ethers::providers::{JsonRpcClient, Provider};
use std::borrow::BorrowMut;
use std::cell::RefCell;
use std::fmt::Debug;

use crate::constants::{SUBQUERY_NUM_INSTANCES, USER_OUTPUT_NUM_INSTANCES};
use crate::subquery::caller::SubqueryCaller;
use crate::subquery::types::AssignedHiLo;

pub trait RawCircuitInput<F: Field, O> {
    fn default() -> Self;
    fn assign(&self, ctx: &mut Context<F>) -> O;
}

pub trait AxiomCircuitScaffold<P: JsonRpcClient, F: Field> {
    type VirtualCircuitInput: Clone + Debug;
    type CircuitInput: Clone + Debug + RawCircuitInput<F, Self::VirtualCircuitInput>;
    type FirstPhasePayload;

    fn virtual_assign_phase0(
        &self,
        builder: &mut RlcCircuitBuilder<F>,
        range: &RangeChip<F>,
        subquery_caller: &mut SubqueryCaller<P, F>,
        callback: &mut Vec<AssignedHiLo<F>>,
        unassigned_inputs: Self::VirtualCircuitInput,
    ) -> Self::FirstPhasePayload;

    /// Most people should not use this
    #[allow(unused_variables)]
    fn virtual_assign_phase1(
        &self,
        builder: &mut RlcCircuitBuilder<F>,
        range: &RangeChip<F>,
        payload: Self::FirstPhasePayload,
    ) {
    }
}

pub struct AxiomCircuitRunner<F: Field, P: JsonRpcClient, A: AxiomCircuitScaffold<P, F>> {
    pub builder: RefCell<RlcCircuitBuilder<F>>,
    pub range: RangeChip<F>,
    pub scaffold: A,
    pub inputs: A::CircuitInput,
    pub provider: Provider<P>,
    pub payload: RefCell<Option<A::FirstPhasePayload>>,
    uses_rlc: bool,
}

impl<F: Field, P: JsonRpcClient + Clone, A: AxiomCircuitScaffold<P, F>>
    AxiomCircuitRunner<F, P, A>
{
    pub fn new(
        scaffold: A,
        provider: Provider<P>,
        params: BaseCircuitParams,
        num_rlc_columns: Option<usize>,
        inputs: Option<A::CircuitInput>,
    ) -> Self {
        let rlc_params = RlcCircuitParams {
            base: params.clone(),
            num_rlc_columns: num_rlc_columns.unwrap_or(0),
        };
        let uses_rlc = rlc_params.num_rlc_columns > 0;
        let rlc_bits = if uses_rlc { DEFAULT_RLC_CACHE_BITS } else { 0 };
        let builder = RlcCircuitBuilder::<F>::new(false, rlc_bits).use_params(rlc_params.clone());
        let range = RangeChip::new(
            params.lookup_bits.unwrap(),
            builder.base.lookup_manager().clone(),
        );
        Self {
            builder: RefCell::new(builder),
            range,
            scaffold,
            inputs: inputs.unwrap_or_else(A::CircuitInput::default),
            provider,
            payload: RefCell::new(None),
            uses_rlc,
        }
    }

    pub fn virtual_assign_phase0(&self) {
        if self.payload.borrow().is_some() {
            return;
        }
        let assigned_inputs = self
            .inputs
            .assign(self.builder.borrow_mut().base.borrow_mut().main(0));

        let mut subquery_caller = SubqueryCaller::new(self.provider.clone());
        let mut callback = Vec::new();
        let payload = self.scaffold.virtual_assign_phase0(
            &mut self.builder.borrow_mut(),
            &self.range,
            &mut subquery_caller,
            &mut callback,
            assigned_inputs,
        );
        self.payload.borrow_mut().replace(payload);
        let mut subquery_instances = subquery_caller.subquery_assigned_values.to_vec();
        subquery_instances.resize_with(SUBQUERY_NUM_INSTANCES, || {
            self.builder.borrow_mut().base.main(0).load_witness(F::ZERO)
        });
        let mut flattened_callback = callback
            .into_iter()
            .flat_map(|hilo| hilo.flatten())
            .collect::<Vec<_>>();
        flattened_callback.resize_with(USER_OUTPUT_NUM_INSTANCES, || {
            self.builder.borrow_mut().base.main(0).load_witness(F::ZERO)
        });
        flattened_callback.extend(subquery_instances);
        let instances = vec![flattened_callback];
        self.builder.borrow_mut().base.assigned_instances = instances.clone();
    }

    pub fn virtual_assign_phase1(&self) {
        let payload = self
            .payload
            .borrow_mut()
            .take()
            .expect("FirstPhase witness generation was not run");
        self.builder.borrow_mut().base.main(1);
        self.scaffold
            .virtual_assign_phase1(&mut self.builder.borrow_mut(), &self.range, payload);
    }

    fn synthesize_without_rlc(
        &self,
        config: BaseConfig<F>,
        mut layouter: impl Layouter<F>,
    ) -> Result<(), Error> {
        self.builder.borrow_mut().base.synthesize(
            config,
            layouter.namespace(|| "BaseCircuitBuilder raw synthesize phase0"),
        )
    }

    fn synthesize_with_rlc(
        &self,
        config: RlcConfig<F>,
        mut layouter: impl Layouter<F>,
    ) -> Result<(), Error> {
        config.base.initialize(&mut layouter);
        self.virtual_assign_phase0();
        {
            let rlc_builder = self.builder.borrow_mut();

            let phase0_layouter = layouter.namespace(|| "RlcCircuitBuilder raw synthesize phase0");
            rlc_builder.raw_synthesize_phase0(&config, phase0_layouter);
        }

        layouter.next_phase();
        self.builder
            .borrow_mut()
            .load_challenge(&config, layouter.namespace(|| "load challenges"));

        self.virtual_assign_phase1();
        {
            let rlc_builder = self.builder.borrow();

            let phase1_layouter = layouter.namespace(|| "RlcCircuitBuilder raw synthesize phase1");
            rlc_builder.raw_synthesize_phase1(&config, phase1_layouter, false);
        }

        let rlc_builder = self.builder.borrow();
        if !rlc_builder.witness_gen_only() {
            layouter.assign_region(
                || "copy constraints",
                |mut region| {
                    let constant_cols = config.base.constants();
                    rlc_builder
                        .copy_manager()
                        .assign_raw(constant_cols, &mut region);
                    Ok(())
                },
            )?;
        }
        drop(rlc_builder);

        self.builder.borrow_mut().clear();
        Ok(())
    }

    pub fn instances(&self) -> Vec<Vec<F>> {
        self.virtual_assign_phase0();
        let builder = self.builder.borrow();
        builder
            .base
            .assigned_instances
            .iter()
            .map(|instance| instance.iter().map(|x| *x.value()).collect())
            .collect()
    }
}

impl<F: Field, P: JsonRpcClient + Clone, A: AxiomCircuitScaffold<P, F>> Circuit<F>
    for AxiomCircuitRunner<F, P, A>
{
    type Config = RlcConfig<F>;
    type Params = RlcCircuitParams;
    type FloorPlanner = SimpleFloorPlanner;

    fn without_witnesses(&self) -> Self {
        unimplemented!()
    }

    fn params(&self) -> Self::Params {
        self.builder.borrow().params().clone()
    }

    fn configure_with_params(meta: &mut ConstraintSystem<F>, params: Self::Params) -> Self::Config {
        let k = params.base.k;
        let mut rlc_config = RlcConfig::configure(meta, params);
        let usable_rows = (1 << k) - meta.minimum_rows();
        rlc_config.set_usable_rows(usable_rows);
        rlc_config
    }

    fn configure(_: &mut ConstraintSystem<F>) -> Self::Config {
        unreachable!()
    }

    fn synthesize(&self, config: Self::Config, layouter: impl Layouter<F>) -> Result<(), Error> {
        if !self.uses_rlc {
            return self.synthesize_without_rlc(config.base, layouter);
        } else {
            return self.synthesize_with_rlc(config, layouter);
        }
    }
}

impl<F: Field, P: JsonRpcClient + Clone, A: AxiomCircuitScaffold<P, F>> CircuitExt<F>
    for AxiomCircuitRunner<F, P, A>
{
    fn num_instance(&self) -> Vec<usize> {
        vec![SUBQUERY_NUM_INSTANCES + USER_OUTPUT_NUM_INSTANCES]
    }

    fn instances(&self) -> Vec<Vec<F>> {
        self.instances()
    }
}

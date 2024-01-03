use std::{
    borrow::BorrowMut,
    cell::RefCell,
    fmt::Debug,
    mem,
    ops::DerefMut,
    sync::{Arc, Mutex},
};

use axiom_codec::{
    constants::{USER_MAX_OUTPUTS, USER_MAX_SUBQUERIES, USER_RESULT_FIELD_ELEMENTS},
    types::field_elements::SUBQUERY_RESULT_LEN,
    utils::native::decode_hilo_to_h256,
    HiLo,
};
use axiom_query::axiom_eth::{
    halo2_base::{
        gates::{
            circuit::{BaseConfig, CircuitBuilderStage},
            RangeChip,
        },
        safe_types::SafeTypeChip,
        virtual_region::manager::VirtualRegionManager,
        AssignedValue, Context,
    },
    halo2_proofs::{
        circuit::{Layouter, SimpleFloorPlanner},
        plonk::{Circuit, ConstraintSystem, Error},
    },
    rlc::{
        circuit::{builder::RlcCircuitBuilder, RlcConfig},
        virtual_region::RlcThreadBreakPoints,
    },
    snark_verifier_sdk::CircuitExt,
    utils::{
        keccak::decorator::{KeccakCallCollector, RlcKeccakCircuitParams, RlcKeccakConfig},
        DEFAULT_RLC_CACHE_BITS,
    },
    zkevm_hashes::keccak::{
        component::circuit::shard::LoadedKeccakF,
        vanilla::{
            keccak_packed_multi::get_num_keccak_f,
            param::{NUM_ROUNDS, NUM_WORDS_TO_ABSORB},
            KeccakCircuitConfig,
        },
    },
    Field,
};
use ethers::providers::{JsonRpcClient, Provider};
use itertools::Itertools;

use crate::{
    subquery::caller::SubqueryCaller,
    types::{AxiomCircuitConfig, AxiomCircuitParams, AxiomV2DataAndResults},
};

pub trait RawCircuitInput<F: Field, O> {
    fn assign(&self, ctx: &mut Context<F>) -> O;
}

pub trait AxiomCircuitScaffold<P: JsonRpcClient, F: Field>: Default + Clone + Debug {
    type VirtualCircuitInput: Clone + Debug;
    type CircuitInput: Clone + Debug + Default + RawCircuitInput<F, Self::VirtualCircuitInput>;
    type FirstPhasePayload: Clone = ();

    fn virtual_assign_phase0(
        &self,
        builder: &mut RlcCircuitBuilder<F>,
        range: &RangeChip<F>,
        subquery_caller: Arc<Mutex<SubqueryCaller<P, F>>>,
        callback: &mut Vec<HiLo<AssignedValue<F>>>,
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

#[derive(Clone, Debug)]
pub struct AxiomCircuit<F: Field, P: JsonRpcClient, A: AxiomCircuitScaffold<P, F>> {
    pub builder: RefCell<RlcCircuitBuilder<F>>,
    pub inputs: A::CircuitInput,
    pub provider: Provider<P>,
    range: RangeChip<F>,
    payload: RefCell<Option<A::FirstPhasePayload>>,
    output: RefCell<AxiomV2DataAndResults>,
    keccak_call_collector: RefCell<KeccakCallCollector<F>>,
    keccak_rows_per_round: usize,
    max_user_outputs: usize,
    max_user_subqueries: usize,
}

impl<F: Field, P: JsonRpcClient + Clone, A: AxiomCircuitScaffold<P, F>> AxiomCircuit<F, P, A> {
    pub fn new(provider: Provider<P>, circuit_params: AxiomCircuitParams) -> Self {
        Self::from_stage(provider, circuit_params, CircuitBuilderStage::Mock)
    }

    pub fn from_stage(
        provider: Provider<P>,
        circuit_params: AxiomCircuitParams,
        stage: CircuitBuilderStage,
    ) -> Self {
        let params = RlcKeccakCircuitParams::from(circuit_params);
        let rlc_bits = if params.rlc.num_rlc_columns > 0 {
            DEFAULT_RLC_CACHE_BITS
        } else {
            0
        };
        let builder =
            RlcCircuitBuilder::<F>::from_stage(stage, rlc_bits).use_params(params.rlc.clone());
        let range = RangeChip::new(
            params.rlc.base.lookup_bits.unwrap(),
            builder.base.lookup_manager().clone(),
        );
        Self {
            builder: RefCell::new(builder),
            range,
            inputs: Default::default(),
            provider,
            payload: RefCell::new(None),
            keccak_rows_per_round: params.keccak_rows_per_round,
            output: Default::default(),
            keccak_call_collector: RefCell::new(Default::default()),
            max_user_outputs: USER_MAX_OUTPUTS,
            max_user_subqueries: USER_MAX_SUBQUERIES,
        }
    }

    pub fn set_max_user_outputs(&mut self, max_user_outputs: usize) {
        self.max_user_outputs = max_user_outputs;
    }

    pub fn use_max_user_outputs(mut self, max_user_outputs: usize) -> Self {
        self.set_max_user_outputs(max_user_outputs);
        self
    }

    pub fn set_max_user_subqueries(&mut self, max_user_subqueries: usize) {
        self.max_user_subqueries = max_user_subqueries;
    }

    pub fn use_max_user_subqueries(mut self, max_user_subqueries: usize) -> Self {
        self.set_max_user_subqueries(max_user_subqueries);
        self
    }

    pub fn set_inputs(&mut self, inputs: A::CircuitInput) {
        self.inputs = inputs;
    }

    pub fn use_inputs(mut self, inputs: A::CircuitInput) -> Self {
        self.set_inputs(inputs);
        self
    }

    pub fn set_break_points(&mut self, break_points: RlcThreadBreakPoints) {
        self.builder.borrow_mut().set_break_points(break_points);
    }

    pub fn use_break_points(mut self, break_points: RlcThreadBreakPoints) -> Self {
        self.set_break_points(break_points);
        self
    }

    pub fn break_points(&self) -> RlcThreadBreakPoints {
        self.builder.borrow().break_points()
    }

    pub fn output_num_instances(&self) -> usize {
        self.max_user_outputs * USER_RESULT_FIELD_ELEMENTS
    }

    pub fn subquery_num_instances(&self) -> usize {
        self.max_user_subqueries * SUBQUERY_RESULT_LEN
    }

    fn virtual_assign_phase0(&self) {
        if self.payload.borrow().is_some() {
            return;
        }
        let assigned_inputs = self
            .inputs
            .assign(self.builder.borrow_mut().base.borrow_mut().main(0));

        let subquery_caller = Arc::new(Mutex::new(SubqueryCaller::new(self.provider.clone())));
        let mut callback = Vec::new();
        let payload = A::virtual_assign_phase0(
            &A::default(),
            &mut self.builder.borrow_mut(),
            &self.range,
            subquery_caller.clone(),
            &mut callback,
            assigned_inputs,
        );
        self.payload.borrow_mut().replace(payload);

        let mut flattened_callback = callback
            .clone()
            .into_iter()
            .flat_map(|hilo| hilo.flatten())
            .collect::<Vec<_>>();
        flattened_callback.resize_with(self.output_num_instances(), || {
            self.builder
                .borrow_mut()
                .base
                .main(0)
                .load_constant(F::ZERO)
        });

        let mut subquery_instances = subquery_caller.lock().unwrap().instances().clone();
        subquery_instances.resize_with(self.subquery_num_instances(), || {
            self.builder
                .borrow_mut()
                .base
                .main(0)
                .load_constant(F::ZERO)
        });

        flattened_callback.extend(subquery_instances);
        let instances = vec![flattened_callback];
        self.builder.borrow_mut().base.assigned_instances = instances.clone();

        let circuit_output = callback
            .iter()
            .map(|hilo| decode_hilo_to_h256(HiLo::from_hi_lo(hilo.hi_lo().map(|x| *x.value()))))
            .collect_vec();
        self.output.replace(AxiomV2DataAndResults {
            data_query: subquery_caller.lock().unwrap().data_query(),
            compute_results: circuit_output,
        });

        self.keccak_call_collector.borrow_mut().var_len_calls =
            subquery_caller.lock().unwrap().keccak_var_len_calls.clone();
        self.keccak_call_collector.borrow_mut().fix_len_calls =
            subquery_caller.lock().unwrap().keccak_fix_len_calls.clone();
    }

    fn virtual_assign_phase1(&self) {
        let payload = self
            .payload
            .borrow_mut()
            .take()
            .expect("FirstPhase witness generation was not run");
        self.builder.borrow_mut().base.main(1);
        A::virtual_assign_phase1(
            &A::default(),
            &mut self.builder.borrow_mut(),
            &self.range,
            payload,
        );
    }

    fn synthesize_without_rlc(
        &self,
        config: BaseConfig<F>,
        mut layouter: impl Layouter<F>,
    ) -> Result<(), Error> {
        self.virtual_assign_phase0();
        if !self.keccak_call_collector.borrow().fix_len_calls.is_empty()
            || !self.keccak_call_collector.borrow().var_len_calls.is_empty()
        {
            panic!("Keccak calls made but keccak_rows_per_round is None");
        }
        self.builder.borrow_mut().base.synthesize(
            config,
            layouter.namespace(|| "BaseCircuitBuilder raw synthesize phase0"),
        )
    }

    fn synthesize_with_rlc_and_keccak(
        &self,
        config: RlcConfig<F>,
        keccak_config: Option<KeccakCircuitConfig<F>>,
        mut layouter: impl Layouter<F>,
    ) -> Result<(), Error> {
        config.base.initialize(&mut layouter);
        let k = self.builder.borrow().params().base.k;
        self.virtual_assign_phase0();
        if let Some(keccak_config) = keccak_config {
            keccak_config.load_aux_tables(&mut layouter, k as u32)?;
            let keccak_calls = mem::take(self.keccak_call_collector.borrow_mut().deref_mut());

            keccak_calls.assign_raw_and_constrain(
                keccak_config.parameters,
                &keccak_config,
                &mut layouter.namespace(|| "keccak sub-circuit"),
                self.builder.borrow_mut().base.pool(0),
                &self.range,
            )?;
        }
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

    fn clear(&self) {
        self.builder.borrow_mut().clear();
        self.payload.borrow_mut().take();
        self.keccak_call_collector.borrow_mut().clear();
        self.output.borrow_mut().compute_results.clear();
        self.output.borrow_mut().data_query.clear();
    }

    pub fn calculate_params(&mut self) {
        self.virtual_assign_phase0();
        let keccak_calls = mem::take(self.keccak_call_collector.borrow_mut().deref_mut());
        let mut capacity = 0;
        for (call, _) in keccak_calls.fix_len_calls.iter() {
            capacity += get_num_keccak_f(call.bytes().len());
        }
        for (call, _) in keccak_calls.var_len_calls.iter() {
            capacity += get_num_keccak_f(call.bytes().max_len());
        }
        // make mock loaded_keccak_fs just to simulate
        let copy_manager_ref = self.builder.borrow().copy_manager().clone();
        let mut copy_manager = copy_manager_ref.lock().unwrap();
        let virtual_keccak_fs = (0..capacity)
            .map(|_| {
                LoadedKeccakF::new(
                    copy_manager.mock_external_assigned(F::ZERO),
                    core::array::from_fn(|_| copy_manager.mock_external_assigned(F::ZERO)),
                    SafeTypeChip::unsafe_to_bool(copy_manager.mock_external_assigned(F::ZERO)),
                    copy_manager.mock_external_assigned(F::ZERO),
                    copy_manager.mock_external_assigned(F::ZERO),
                )
            })
            .collect_vec();
        drop(copy_manager);
        keccak_calls.pack_and_constrain(
            virtual_keccak_fs,
            self.builder.borrow_mut().base.pool(0),
            self.range.borrow_mut(),
        );
        self.virtual_assign_phase1();

        // TMP: use empirical constants
        let unusable_rows = 109;
        self.builder
            .borrow_mut()
            .calculate_params(Some(unusable_rows));
        let usable_rows = (1 << self.builder.borrow().base.config_params.k) - unusable_rows;
        // This is the inverse of [zkevm_hashes::keccak::vanilla::keccak_packed_multi::get_keccak_capacity].
        let rows_per_round = usable_rows / (capacity * (NUM_ROUNDS + 1) + 1 + NUM_WORDS_TO_ABSORB);
        // log::info!("RlcKeccakCircuit used capacity: {capacity}");
        // log::info!("RlcKeccakCircuit optimal rows_per_round : {rows_per_round}");
        // Empirically more than 50 rows makes the rotations inhibit performance.
        self.keccak_rows_per_round = rows_per_round.min(50);

        self.clear();
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

    pub fn scaffold_output(&self) -> AxiomV2DataAndResults {
        self.virtual_assign_phase0();
        self.output.borrow().clone()
    }
}

impl<F: Field, P: JsonRpcClient + Clone, A: AxiomCircuitScaffold<P, F>> Circuit<F>
    for AxiomCircuit<F, P, A>
{
    type Config = AxiomCircuitConfig<F>;
    type Params = AxiomCircuitParams;
    type FloorPlanner = SimpleFloorPlanner;

    fn without_witnesses(&self) -> Self {
        unimplemented!()
    }

    fn params(&self) -> Self::Params {
        let rlc_params = self.builder.borrow().params();
        if rlc_params.num_rlc_columns == 0 && self.keccak_rows_per_round == 0 {
            AxiomCircuitParams::Base(rlc_params.base)
        } else if self.keccak_rows_per_round == 0 {
            return AxiomCircuitParams::Rlc(rlc_params);
        } else {
            return AxiomCircuitParams::Keccak(RlcKeccakCircuitParams {
                rlc: rlc_params,
                keccak_rows_per_round: self.keccak_rows_per_round,
            });
        }
    }

    fn configure_with_params(meta: &mut ConstraintSystem<F>, params: Self::Params) -> Self::Config {
        match params {
            AxiomCircuitParams::Rlc(params) => {
                let k = params.base.k;
                let mut rlc_config = RlcConfig::configure(meta, params);
                let usable_rows = (1 << k) - meta.minimum_rows();
                rlc_config.set_usable_rows(usable_rows);
                AxiomCircuitConfig::Rlc(rlc_config)
            }
            AxiomCircuitParams::Base(params) => {
                AxiomCircuitConfig::Base(BaseConfig::configure(meta, params))
            }
            AxiomCircuitParams::Keccak(params) => {
                AxiomCircuitConfig::Keccak(RlcKeccakConfig::configure(meta, params))
            }
        }
    }

    fn configure(_: &mut ConstraintSystem<F>) -> Self::Config {
        unreachable!()
    }

    fn synthesize(&self, config: Self::Config, layouter: impl Layouter<F>) -> Result<(), Error> {
        match config {
            AxiomCircuitConfig::Rlc(config) => {
                self.synthesize_with_rlc_and_keccak(config, None, layouter)
            }
            AxiomCircuitConfig::Base(config) => self.synthesize_without_rlc(config, layouter),
            AxiomCircuitConfig::Keccak(config) => {
                self.synthesize_with_rlc_and_keccak(config.rlc, Some(config.keccak), layouter)
            }
        }
    }
}

impl<F: Field, P: JsonRpcClient + Clone, A: AxiomCircuitScaffold<P, F> + Default> CircuitExt<F>
    for AxiomCircuit<F, P, A>
{
    fn num_instance(&self) -> Vec<usize> {
        vec![self.output_num_instances() + self.subquery_num_instances()]
    }

    fn instances(&self) -> Vec<Vec<F>> {
        self.instances()
    }
}

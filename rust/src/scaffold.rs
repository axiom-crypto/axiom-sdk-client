use crate::constants::{SUBQUERY_NUM_INSTANCES, USER_OUTPUT_NUM_INSTANCES};
use crate::subquery::caller::SubqueryCaller;
use crate::subquery::types::RawSubquery;
use axiom_codec::HiLo;
use axiom_eth::halo2_base::gates::circuit::{BaseCircuitParams, BaseConfig};
use axiom_eth::halo2_base::safe_types::SafeTypeChip;
use axiom_eth::halo2_base::virtual_region::manager::VirtualRegionManager;
use axiom_eth::halo2_base::{AssignedValue, Context};
use axiom_eth::rlc::circuit::RlcCircuitParams;
use axiom_eth::snark_verifier_sdk::CircuitExt;
use axiom_eth::utils::keccak::decorator::KeccakCallCollector;
use axiom_eth::utils::keccak::decorator::{RlcKeccakCircuitParams, RlcKeccakConfig};
use axiom_eth::utils::DEFAULT_RLC_CACHE_BITS;
use axiom_eth::zkevm_hashes::keccak::component::circuit::shard::LoadedKeccakF;
use axiom_eth::zkevm_hashes::keccak::vanilla::keccak_packed_multi::get_num_keccak_f;
use axiom_eth::zkevm_hashes::keccak::vanilla::param::{NUM_ROUNDS, NUM_WORDS_TO_ABSORB};
use axiom_eth::zkevm_hashes::keccak::vanilla::{KeccakCircuitConfig, KeccakConfigParams};
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
use itertools::Itertools;
use std::borrow::BorrowMut;
use std::cell::RefCell;
use std::fmt::Debug;
use std::mem;
use std::ops::DerefMut;

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

pub struct AxiomCircuitRunner<F: Field, P: JsonRpcClient, A: AxiomCircuitScaffold<P, F>> {
    pub builder: RefCell<RlcCircuitBuilder<F>>,
    pub range: RangeChip<F>,
    pub scaffold: A,
    pub inputs: A::CircuitInput,
    pub provider: Provider<P>,
    pub payload: RefCell<Option<A::FirstPhasePayload>>,
    pub keccak_rows_per_round: usize,
    data_query: RefCell<Vec<RawSubquery>>,
    keccak_call_collector: RefCell<Option<KeccakCallCollector<F>>>,
}

impl<F: Field, P: JsonRpcClient + Clone, A: AxiomCircuitScaffold<P, F>>
    AxiomCircuitRunner<F, P, A>
{
    pub fn new(
        scaffold: A,
        provider: Provider<P>,
        params: BaseCircuitParams,
        num_rlc_columns: Option<usize>,
        keccak_rows_per_round: Option<usize>,
        inputs: Option<A::CircuitInput>,
    ) -> Self {
        let rlc_params = RlcCircuitParams {
            base: params.clone(),
            num_rlc_columns: num_rlc_columns.unwrap_or(0),
        };
        let rlc_bits = if rlc_params.num_rlc_columns > 0 {
            DEFAULT_RLC_CACHE_BITS
        } else {
            0
        };
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
            keccak_rows_per_round: keccak_rows_per_round.unwrap_or(0),
            data_query: RefCell::new(Vec::new()),
            keccak_call_collector: RefCell::new(None),
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

        let mut flattened_callback = callback
            .into_iter()
            .flat_map(|hilo| hilo.flatten())
            .collect::<Vec<_>>();
        flattened_callback.resize_with(USER_OUTPUT_NUM_INSTANCES, || {
            self.builder.borrow_mut().base.main(0).load_witness(F::ZERO)
        });

        let mut subquery_instances = subquery_caller.subquery_assigned_values.to_vec();
        subquery_instances.resize_with(SUBQUERY_NUM_INSTANCES, || {
            self.builder.borrow_mut().base.main(0).load_witness(F::ZERO)
        });

        flattened_callback.extend(subquery_instances);
        let instances = vec![flattened_callback];
        self.builder.borrow_mut().base.assigned_instances = instances.clone();
        self.data_query.replace(subquery_caller.data_query());

        if self.keccak_rows_per_round > 0 {
            let keccak_calls = KeccakCallCollector::new(
                subquery_caller.keccak_fix_len_calls,
                subquery_caller.keccak_var_len_calls,
            );
            self.keccak_call_collector
                .borrow_mut()
                .replace(keccak_calls);
        }
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
        self.virtual_assign_phase0();
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
            let keccak_circuit_params = KeccakConfigParams {
                k: k as u32,
                rows_per_round: self.keccak_rows_per_round,
            };
            let keccak_calls =
                mem::take(self.keccak_call_collector.borrow_mut().deref_mut()).unwrap();

            keccak_calls.assign_raw_and_constrain(
                keccak_circuit_params,
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
        self.keccak_call_collector.borrow_mut().take();
        self.data_query.borrow_mut().clear();
    }

    pub fn calculate_params(&mut self) {
        self.virtual_assign_phase0();
        let keccak_calls = mem::take(self.keccak_call_collector.borrow_mut().deref_mut()).unwrap();
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
}

#[derive(Clone, Debug)]
pub enum AxiomCircuitConfig<F: Field> {
    Rlc(RlcConfig<F>),
    Base(BaseConfig<F>),
    Keccak(RlcKeccakConfig<F>),
}

#[derive(Clone, Debug)]
pub enum AxiomCircuitParams {
    Rlc(RlcCircuitParams),
    Base(BaseCircuitParams),
    Keccak(RlcKeccakCircuitParams),
}

impl Default for AxiomCircuitParams {
    fn default() -> Self {
        Self::Base(BaseCircuitParams::default())
    }
}

impl<F: Field, P: JsonRpcClient + Clone, A: AxiomCircuitScaffold<P, F>> Circuit<F>
    for AxiomCircuitRunner<F, P, A>
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
            AxiomCircuitConfig::Base(config) => {
                self.synthesize_without_rlc(config, layouter)
            }
            AxiomCircuitConfig::Keccak(config) => {
                self.synthesize_with_rlc_and_keccak(
                    config.rlc,
                    Some(config.keccak),
                    layouter,
                )
            }
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

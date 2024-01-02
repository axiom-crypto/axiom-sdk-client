use std::collections::BTreeMap;

use anyhow::Result;
use axiom_codec::{
    constants::MAX_SUBQUERY_INPUTS,
    types::{field_elements::SUBQUERY_RESULT_LEN, native::AnySubquery},
    HiLo,
};
use axiom_query::axiom_eth::{
    halo2_base::{AssignedValue, Context, ContextTag},
    keccak::promise::{KeccakFixLenCall, KeccakVarLenCall},
    utils::encode_h256_to_hilo,
    Field,
};
use ethers::{
    providers::{JsonRpcClient, Provider},
    types::H256,
};
use itertools::Itertools;

use super::{
    keccak::{KeccakSubquery, KeccakSubqueryTypes},
    types::Subquery,
};
use crate::subquery::{types::RawSubquery, utils::get_subquery_type_from_any_subquery};

pub trait FetchSubquery<F: Field> {
    fn fetch<P: JsonRpcClient>(&self, p: &Provider<P>) -> Result<(H256, Vec<AssignedValue<F>>)>;
    fn any_subquery(&self) -> AnySubquery;
}

pub struct SubqueryCaller<P: JsonRpcClient, F: Field> {
    pub provider: Provider<P>,
    pub subqueries: BTreeMap<ContextTag, Vec<(AnySubquery, H256)>>,
    pub subquery_assigned_values: BTreeMap<ContextTag, Vec<AssignedValue<F>>>,
    pub keccak_fix_len_calls: Vec<(KeccakFixLenCall<F>, HiLo<AssignedValue<F>>)>,
    pub keccak_var_len_calls: Vec<(KeccakVarLenCall<F>, HiLo<AssignedValue<F>>)>,
}

impl<P: JsonRpcClient, F: Field> SubqueryCaller<P, F> {
    pub fn new(provider: Provider<P>) -> Self {
        Self {
            provider,
            subqueries: BTreeMap::new(),
            subquery_assigned_values: BTreeMap::new(),
            keccak_fix_len_calls: Vec::new(),
            keccak_var_len_calls: Vec::new(),
        }
    }

    pub fn clear(&mut self) {
        self.subqueries.clear();
        self.subquery_assigned_values.clear();
        self.keccak_fix_len_calls.clear();
        self.keccak_var_len_calls.clear();
    }

    pub fn data_query(&self) -> Vec<Subquery> {
        let subqueries: Vec<Subquery> = self
            .subqueries
            .values()
            .flat_map(|val| {
                val.iter()
                    .map(|(any_subquery, result)| Subquery {
                        subquery_type: get_subquery_type_from_any_subquery(&any_subquery.clone()),
                        subquery_data: RawSubquery(any_subquery.clone()),
                        val: *result,
                    })
                    .collect_vec()
            })
            .collect_vec();
        subqueries
    }

    pub fn instances(&self) -> Vec<AssignedValue<F>> {
        self.subquery_assigned_values
            .values()
            .flatten()
            .cloned()
            .collect_vec()
    }

    pub fn call<T: FetchSubquery<F>>(
        &mut self,
        ctx: &mut Context<F>,
        subquery: T,
    ) -> HiLo<AssignedValue<F>> {
        let result = subquery.fetch(&self.provider).unwrap();
        let any_subquery = subquery.any_subquery();
        let val = (any_subquery.clone(), result.0);
        self.subqueries
            .entry(ctx.tag())
            .and_modify(|thread| thread.push(val.clone()))
            .or_insert(vec![val]);
        let subquery_type = get_subquery_type_from_any_subquery(&any_subquery);
        let hilo = encode_h256_to_hilo(&result.0);
        let hi = ctx.load_witness(hilo.hi());
        let lo = ctx.load_witness(hilo.lo());
        let subquery_type_assigned_value = ctx.load_constant(F::from(subquery_type));
        let hi_lo_vec = vec![hi, lo];
        let mut input = result.1;
        input.resize_with(MAX_SUBQUERY_INPUTS, || ctx.load_witness(F::ZERO));
        let mut flattened_subquery = vec![subquery_type_assigned_value];
        flattened_subquery.extend(input);
        flattened_subquery.extend(hi_lo_vec);
        assert_eq!(flattened_subquery.len(), SUBQUERY_RESULT_LEN);
        self.subquery_assigned_values
            .entry(ctx.tag())
            .and_modify(|thread| thread.extend(flattened_subquery.clone()))
            .or_insert(flattened_subquery);
        HiLo::from_hi_lo([hi, lo])
    }

    pub fn keccak<T: KeccakSubquery<F>>(
        &mut self,
        ctx: &mut Context<F>,
        subquery: T,
    ) -> HiLo<AssignedValue<F>> {
        let logic_input = subquery.to_logical_input();
        let output_fe = logic_input.compute_output();
        let hi = ctx.load_witness(output_fe.hash.hi());
        let lo = ctx.load_witness(output_fe.hash.lo());
        let hilo = HiLo::from_hi_lo([hi, lo]);
        match subquery.subquery_type() {
            KeccakSubqueryTypes::FixLen(call) => {
                self.keccak_fix_len_calls.push((call, hilo));
            }
            KeccakSubqueryTypes::VarLen(call) => {
                self.keccak_var_len_calls.push((call, hilo));
            }
        };
        hilo
    }
}

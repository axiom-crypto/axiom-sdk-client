use std::marker::PhantomData;

use anyhow::Result;
use axiom_codec::{
    constants::MAX_SUBQUERY_INPUTS,
    types::{native::{AnySubquery, SubqueryType}, field_elements::SUBQUERY_RESULT_LEN},
};
use axiom_eth::{
    halo2_base::{AssignedValue, Context},
    utils::encode_h256_to_hilo,
    Field,
};
use ethers::{
    providers::{JsonRpcClient, Provider},
    types::H256,
};

use super::types::AssignedHiLo;

fn get_subquery_type_from_any_subquery(any_subquery: &AnySubquery) -> u64 {
    let subquery_type = match any_subquery {
        AnySubquery::Null => SubqueryType::Null,
        AnySubquery::Header(_) => SubqueryType::Header,
        AnySubquery::Account(_) => SubqueryType::Account,
        AnySubquery::Storage(_) => SubqueryType::Storage,
        AnySubquery::Receipt(_) => SubqueryType::Receipt,
        AnySubquery::Transaction(_) => SubqueryType::Transaction,
        AnySubquery::SolidityNestedMapping(_) => SubqueryType::SolidityNestedMapping,
    };
    subquery_type as u64
}

pub trait FetchSubquery<F: Field> {
    fn fetch<P: JsonRpcClient>(&self, p: &Provider<P>) -> Result<(H256, Vec<AssignedValue<F>>)>;
    fn any_subquery(&self) -> AnySubquery;
}

pub struct SubqueryCaller<P: JsonRpcClient, F: Field> {
    pub provider: Provider<P>,
    pub subqueries: Vec<(AnySubquery, H256)>,
    pub subquery_assigned_values: Vec<AssignedValue<F>>,
    _phantom: PhantomData<F>,
}

impl<P: JsonRpcClient, F: Field> SubqueryCaller<P, F> {
    pub fn new(provider: Provider<P>) -> Self {
        Self {
            provider,
            subqueries: Vec::new(),
            subquery_assigned_values: Vec::new(),
            _phantom: PhantomData,
        }
    }

    pub fn call<T: FetchSubquery<F>>(
        &mut self,
        ctx: &mut Context<F>,
        subquery: T,
    ) -> AssignedHiLo<F> {
        let result = subquery.fetch(&self.provider).unwrap();
        let any_subquery = subquery.any_subquery();
        self.subqueries.push((any_subquery.clone(), result.0));
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
        self.subquery_assigned_values.extend(flattened_subquery);
        AssignedHiLo { hi, lo }
    }
}

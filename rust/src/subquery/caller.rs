use anyhow::Result;
use axiom_codec::{
    constants::MAX_SUBQUERY_INPUTS,
    types::{
        field_elements::SUBQUERY_RESULT_LEN,
        native::{AnySubquery, SubqueryType},
    },
    HiLo,
};
use axiom_eth::{
    halo2_base::{AssignedValue, Context},
    keccak::{promise::{KeccakFixLenCall, KeccakVarLenCall}, types::KeccakLogicalInput},
    utils::encode_h256_to_hilo,
    Field,
};
use ethers::{
    providers::{JsonRpcClient, Provider},
    types::H256,
};

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

pub enum KeccakSubqueryTypes<F: Field> {
    FixLen(KeccakFixLenCall<F>),
    VarLen(KeccakVarLenCall<F>),
}

pub trait KeccakSubquery<F: Field> {
    fn to_logical_input(&self) -> KeccakLogicalInput;
    fn subquery_type(&self) -> KeccakSubqueryTypes<F>;
}

impl<F: Field> KeccakSubquery<F> for KeccakFixLenCall<F> {
    fn to_logical_input(&self) -> KeccakLogicalInput {
        self.to_logical_input()
    }

    fn subquery_type(&self) -> KeccakSubqueryTypes<F> {
        KeccakSubqueryTypes::FixLen(self.clone())
    }
}

impl<F: Field> KeccakSubquery<F> for KeccakVarLenCall<F> {
    fn to_logical_input(&self) -> KeccakLogicalInput {
        self.to_logical_input()
    }

    fn subquery_type(&self) -> KeccakSubqueryTypes<F> {
        KeccakSubqueryTypes::VarLen(self.clone())
    }
}

pub struct SubqueryCaller<P: JsonRpcClient, F: Field> {
    pub provider: Provider<P>,
    pub subqueries: Vec<(AnySubquery, H256)>,
    pub subquery_assigned_values: Vec<AssignedValue<F>>,
    pub keccak_fix_len_calls: Vec<(KeccakFixLenCall<F>, HiLo<AssignedValue<F>>)>,
    pub keccak_var_len_calls: Vec<(KeccakVarLenCall<F>, HiLo<AssignedValue<F>>)>,
}

impl<P: JsonRpcClient, F: Field> SubqueryCaller<P, F> {
    pub fn new(provider: Provider<P>) -> Self {
        Self {
            provider,
            subqueries: Vec::new(),
            subquery_assigned_values: Vec::new(),
            keccak_fix_len_calls: Vec::new(),
            keccak_var_len_calls: Vec::new(),
        }
    }

    pub fn call<T: FetchSubquery<F>>(
        &mut self,
        ctx: &mut Context<F>,
        subquery: T,
    ) -> HiLo<AssignedValue<F>> {
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

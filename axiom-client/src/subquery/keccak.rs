use axiom_query::axiom_eth::{
    keccak::{
        promise::{KeccakFixLenCall, KeccakVarLenCall},
        types::KeccakLogicalInput,
    },
    Field,
};

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

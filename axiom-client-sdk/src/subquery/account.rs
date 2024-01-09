use std::sync::{Arc, Mutex};

use axiom_client::{
    axiom_codec::HiLo,
    axiom_eth::halo2_base::{AssignedValue, Context},
    subquery::{account::AccountField, caller::SubqueryCaller, types::AssignedAccountSubquery},
};
use ethers::providers::JsonRpcClient;

use crate::Fr;

pub struct Account<'a, P: JsonRpcClient> {
    pub block_number: AssignedValue<Fr>,
    pub addr: AssignedValue<Fr>,
    ctx: &'a mut Context<Fr>,
    caller: Arc<Mutex<SubqueryCaller<P, Fr>>>,
}

pub fn get_account<P: JsonRpcClient>(
    ctx: &mut Context<Fr>,
    caller: Arc<Mutex<SubqueryCaller<P, Fr>>>,
    block_number: AssignedValue<Fr>,
    addr: AssignedValue<Fr>,
) -> Account<P> {
    Account {
        block_number,
        addr,
        ctx,
        caller,
    }
}

impl<'a, P: JsonRpcClient> Account<'a, P> {
    pub fn call(self, field: AccountField) -> HiLo<AssignedValue<Fr>> {
        let field_constant = self.ctx.load_constant(Fr::from(field));
        let mut subquery_caller = self.caller.lock().unwrap();
        let subquery = AssignedAccountSubquery {
            block_number: self.block_number,
            addr: self.addr,
            field_idx: field_constant,
        };
        subquery_caller.call(self.ctx, subquery)
    }
}

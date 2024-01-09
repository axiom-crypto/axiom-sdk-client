use std::sync::{Arc, Mutex};

use axiom_client::{
    axiom_codec::HiLo,
    axiom_eth::halo2_base::{AssignedValue, Context},
    subquery::{caller::SubqueryCaller, types::AssignedStorageSubquery},
};
use ethers::providers::JsonRpcClient;

use crate::Fr;

pub struct Storage<'a, P: JsonRpcClient> {
    pub block_number: AssignedValue<Fr>,
    pub addr: AssignedValue<Fr>,
    ctx: &'a mut Context<Fr>,
    caller: Arc<Mutex<SubqueryCaller<P, Fr>>>,
}

pub fn get_storage<P: JsonRpcClient>(
    ctx: &mut Context<Fr>,
    caller: Arc<Mutex<SubqueryCaller<P, Fr>>>,
    block_number: AssignedValue<Fr>,
    addr: AssignedValue<Fr>,
) -> Storage<P> {
    Storage {
        block_number,
        addr,
        ctx,
        caller,
    }
}

impl<'a, P: JsonRpcClient> Storage<'a, P> {
    pub fn slot(self, slot: HiLo<AssignedValue<Fr>>) -> HiLo<AssignedValue<Fr>> {
        let mut subquery_caller = self.caller.lock().unwrap();
        let subquery = AssignedStorageSubquery {
            block_number: self.block_number,
            addr: self.addr,
            slot,
        };
        subquery_caller.call(self.ctx, subquery)
    }
}

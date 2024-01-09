use axiom_client::{
    axiom_codec::HiLo,
    axiom_eth::halo2_base::{AssignedValue, Context},
    subquery::types::AssignedStorageSubquery,
};

use crate::{Fr, SubqueryCaller};

pub struct Storage<'a> {
    pub block_number: AssignedValue<Fr>,
    pub addr: AssignedValue<Fr>,
    ctx: &'a mut Context<Fr>,
    caller: SubqueryCaller,
}

pub fn get_storage(
    ctx: &mut Context<Fr>,
    caller: SubqueryCaller,
    block_number: AssignedValue<Fr>,
    addr: AssignedValue<Fr>,
) -> Storage {
    Storage {
        block_number,
        addr,
        ctx,
        caller,
    }
}

impl<'a> Storage<'a> {
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

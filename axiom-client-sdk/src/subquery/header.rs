use std::sync::{Arc, Mutex};

use axiom_client::{
    axiom_codec::{special_values::HEADER_LOGS_BLOOM_FIELD_IDX_OFFSET, HiLo},
    axiom_eth::halo2_base::{AssignedValue, Context},
    subquery::{caller::SubqueryCaller, types::AssignedHeaderSubquery, HeaderField},
};
use ethers::providers::Http;

use crate::Fr;

pub struct Header<'a> {
    pub block_number: AssignedValue<Fr>,
    ctx: &'a mut Context<Fr>,
    caller: Arc<Mutex<SubqueryCaller<Http, Fr>>>,
}

pub fn get_header(
    ctx: &mut Context<Fr>,
    caller: Arc<Mutex<SubqueryCaller<Http, Fr>>>,
    block_number: AssignedValue<Fr>,
) -> Header {
    Header {
        block_number,
        ctx,
        caller,
    }
}

impl<'a> Header<'a> {
    pub fn call(self, field: HeaderField) -> HiLo<AssignedValue<Fr>> {
        let field_constant = self.ctx.load_constant(Fr::from(field));
        let mut subquery_caller = self.caller.lock().unwrap();
        let subquery = AssignedHeaderSubquery {
            block_number: self.block_number,
            field_idx: field_constant,
        };
        subquery_caller.call(self.ctx, subquery)
    }

    pub fn logs_bloom(self, logs_bloom_idx: usize) -> HiLo<AssignedValue<Fr>> {
        let mut subquery_caller = self.caller.lock().unwrap();
        if logs_bloom_idx >= 8 {
            panic!("logs_bloom_idx range is [0, 8)");
        }
        let field_idx = logs_bloom_idx + HEADER_LOGS_BLOOM_FIELD_IDX_OFFSET;
        let assigned_field_idx = self.ctx.load_constant(Fr::from(field_idx as u64));
        let subquery = AssignedHeaderSubquery {
            block_number: self.block_number,
            field_idx: assigned_field_idx,
        };
        subquery_caller.call(self.ctx, subquery)
    }
}

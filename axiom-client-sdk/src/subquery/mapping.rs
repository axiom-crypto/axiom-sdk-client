use std::sync::{Arc, Mutex};

use axiom_client::{
    axiom_codec::{constants::MAX_SOLIDITY_MAPPING_KEYS, HiLo},
    axiom_eth::halo2_base::{AssignedValue, Context},
    subquery::{caller::SubqueryCaller, types::AssignedSolidityNestedMappingSubquery},
};
use ethers::providers::Http;

use crate::Fr;

pub struct SolidityMapping<'a> {
    pub block_number: AssignedValue<Fr>,
    pub addr: AssignedValue<Fr>,
    pub mapping_slot: HiLo<AssignedValue<Fr>>,
    ctx: &'a mut Context<Fr>,
    caller: Arc<Mutex<SubqueryCaller<Http, Fr>>>,
}

pub fn get_mapping(
    ctx: &mut Context<Fr>,
    caller: Arc<Mutex<SubqueryCaller<Http, Fr>>>,
    block_number: AssignedValue<Fr>,
    addr: AssignedValue<Fr>,
    mapping_slot: HiLo<AssignedValue<Fr>>,
) -> SolidityMapping {
    SolidityMapping {
        block_number,
        addr,
        mapping_slot,
        ctx,
        caller,
    }
}

impl<'a> SolidityMapping<'a> {
    pub fn nested(self, keys: Vec<HiLo<AssignedValue<Fr>>>) -> HiLo<AssignedValue<Fr>> {
        if keys.is_empty() || keys.len() > MAX_SOLIDITY_MAPPING_KEYS {
            panic!(
                "Invalid number of keys for solidity mapping: {}. Must be in range [1, 4]",
                keys.len()
            );
        }
        let mut subquery_caller = self.caller.lock().unwrap();
        let depth = self.ctx.load_constant(Fr::from(keys.len() as u64));
        let mut padded_keys = keys.clone();
        padded_keys.resize_with(MAX_SOLIDITY_MAPPING_KEYS, || {
            let zeros = self.ctx.load_constants(&[Fr::zero(), Fr::zero()]);
            HiLo::from_hi_lo([zeros[0], zeros[1]])
        });
        let mut keys = [keys[0]; MAX_SOLIDITY_MAPPING_KEYS];
        keys.copy_from_slice(&padded_keys);
        let subquery = AssignedSolidityNestedMappingSubquery {
            block_number: self.block_number,
            addr: self.addr,
            mapping_slot: self.mapping_slot,
            mapping_depth: depth,
            keys,
        };
        subquery_caller.call(self.ctx, subquery)
    }

    pub fn key(self, key: HiLo<AssignedValue<Fr>>) -> HiLo<AssignedValue<Fr>> {
        self.nested(vec![key])
    }
}

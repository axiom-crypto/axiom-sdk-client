use anyhow::Result;
use axiom_codec::types::native::{AnySubquery, SolidityNestedMappingSubquery, StorageSubquery};
use axiom_query::axiom_eth::{halo2_base::AssignedValue, Field};
use ethers::{
    providers::{JsonRpcClient, Provider},
    types::{BigEndianHash, H256},
    utils::keccak256,
};
use tokio::runtime::Runtime;

use super::{
    caller::FetchSubquery, storage::get_storage_field_value,
    types::AssignedSolidityNestedMappingSubquery,
};

pub async fn get_solidity_nested_mapping_field_value<P: JsonRpcClient>(
    provider: &Provider<P>,
    query: SolidityNestedMappingSubquery,
) -> Result<H256> {
    let mut slot = H256::from_uint(&query.mapping_slot);
    for i in 0..query.mapping_depth {
        let key = query.keys.get(i as usize).unwrap();
        let concat_h256 = key
            .as_bytes()
            .iter()
            .copied()
            .chain(slot.as_bytes().to_vec())
            .collect::<Vec<u8>>();
        slot = H256::from(keccak256(concat_h256));
    }

    let storage_query = StorageSubquery {
        block_number: query.block_number,
        addr: query.addr,
        slot: slot.into_uint(),
    };

    get_storage_field_value(provider, storage_query).await
}

impl<F: Field> FetchSubquery<F> for AssignedSolidityNestedMappingSubquery<F> {
    fn fetch<P: JsonRpcClient>(&self, p: &Provider<P>) -> Result<H256> {
        let rt = Runtime::new()?;
        let val = rt.block_on(get_solidity_nested_mapping_field_value(p, (*self).into()))?;
        Ok(val)
    }

    fn any_subquery(&self) -> AnySubquery {
        AnySubquery::SolidityNestedMapping((*self).into())
    }

    fn flatten(&self) -> Vec<AssignedValue<F>> {
        let mut flattened = vec![
            self.block_number,
            self.addr,
            self.mapping_slot.hi(),
            self.mapping_slot.lo(),
            self.mapping_depth,
        ];
        let hi_lo_keys = self
            .keys
            .iter()
            .flat_map(|k| [k.hi(), k.lo()])
            .collect::<Vec<_>>();
        flattened.extend(hi_lo_keys);
        flattened
    }
}

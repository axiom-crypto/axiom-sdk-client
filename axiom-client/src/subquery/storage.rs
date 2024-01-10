use anyhow::Result;
use axiom_codec::types::native::{AnySubquery, StorageSubquery};
use axiom_query::axiom_eth::{halo2_base::AssignedValue, Field};
use ethers::{
    providers::{JsonRpcClient, Middleware, Provider},
    types::{BigEndianHash, BlockId, H256},
};
use tokio::runtime::Runtime;

use super::{caller::FetchSubquery, types::AssignedStorageSubquery};

pub async fn get_storage_field_value<P: JsonRpcClient>(
    provider: &Provider<P>,
    query: StorageSubquery,
) -> Result<H256> {
    let block_id = BlockId::from(query.block_number as u64);
    let val = provider
        .get_storage_at(query.addr, H256::from_uint(&query.slot), Some(block_id))
        .await?;

    Ok(val)
}

impl<F: Field> FetchSubquery<F> for AssignedStorageSubquery<F> {
    fn fetch<P: JsonRpcClient>(&self, p: &Provider<P>) -> Result<H256> {
        let rt = Runtime::new()?;
        let val = rt.block_on(get_storage_field_value(p, (*self).into()))?;
        Ok(val)
    }

    fn any_subquery(&self) -> AnySubquery {
        AnySubquery::Storage((*self).into())
    }

    fn flatten(&self) -> Vec<AssignedValue<F>> {
        vec![self.block_number, self.addr, self.slot.hi(), self.slot.lo()]
    }
}

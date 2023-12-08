use anyhow::Result;
use axiom_codec::types::native::{StorageSubquery, AnySubquery};
use axiom_eth::{Field, halo2_base::AssignedValue};
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
    // let block = provider.get_block(block_id).await?;
    // if block.is_none() {
    //     bail!("Block does not exist")
    // }

    // let block = block.unwrap();
    // let slot = query.slot;
    // let slots = vec![H256::from_uint(&slot)];
    // let account = provider.get_proof(query.addr, slots, Some(block_id)).await;

    // if account.is_err() {
    //     bail!("Account does not exist")
    // }
    // let account = account.unwrap();
    // let accountProof = account.account_proof;

    let val = provider
        .get_storage_at(query.addr, H256::from_uint(&query.slot), Some(block_id))
        .await?;

    Ok(val)
}

impl<F: Field> FetchSubquery<F> for AssignedStorageSubquery<F> {
    fn fetch<P: JsonRpcClient>(&self, p: &Provider<P>) -> Result<(H256, Vec<AssignedValue<F>>)> {
        let rt = Runtime::new()?;
        let val = rt.block_on(get_storage_field_value(p, (*self).into()))?;
        let flattened = vec![self.block_number, self.addr, self.slot.hi(), self.slot.lo()];
        Ok((val, flattened))
    }

    fn any_subquery(&self) -> AnySubquery {
        AnySubquery::Storage((*self).into())
    }
}

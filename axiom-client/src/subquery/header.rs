use anyhow::{bail, Result};
use axiom_codec::{
    special_values::{
        HEADER_EXTRA_DATA_LEN_FIELD_IDX, HEADER_HASH_FIELD_IDX, HEADER_HEADER_SIZE_FIELD_IDX,
        HEADER_LOGS_BLOOM_FIELD_IDX_OFFSET,
    },
    types::native::{AnySubquery, HeaderSubquery},
};
use axiom_query::axiom_eth::{halo2_base::AssignedValue, Field};
use ethers::{
    providers::{JsonRpcClient, Middleware, Provider},
    types::{BigEndianHash, BlockId, H256},
};
use num_derive::FromPrimitive;
use num_traits::FromPrimitive;
use tokio::runtime::Runtime;

use super::{caller::FetchSubquery, types::AssignedHeaderSubquery, utils::pad_to_bytes32};
use crate::impl_fr_from;

#[derive(FromPrimitive, Clone)]
pub enum HeaderField {
    ParentHash,
    Sha3Uncles,
    Miner,
    StateRoot,
    TransactionsRoot,
    ReceiptsRoot,
    LogsBloom,
    Difficulty,
    Number,
    GasLimit,
    GasUsed,
    Timestamp,
    ExtraData,
    MixHash,
    Nonce,
    BaseFeePerGas,
    WithdrawalsRoot,
    Hash = HEADER_HASH_FIELD_IDX as isize,
    Size = HEADER_HEADER_SIZE_FIELD_IDX as isize,
    ExtraDataLen = HEADER_EXTRA_DATA_LEN_FIELD_IDX as isize,
}
impl_fr_from!(HeaderField);

pub async fn get_header_field_value<P: JsonRpcClient>(
    provider: &Provider<P>,
    query: HeaderSubquery,
) -> Result<H256> {
    let block_id = BlockId::from(query.block_number as u64);
    let block = provider.get_block(block_id).await?;
    if block.is_none() {
        bail!("Block does not exist")
    }
    let block = block.unwrap();

    let field_idx = query.field_idx as usize;

    if (HEADER_LOGS_BLOOM_FIELD_IDX_OFFSET..HEADER_LOGS_BLOOM_FIELD_IDX_OFFSET + 8)
        .contains(&field_idx)
    {
        let bloom = block.logs_bloom.unwrap().to_fixed_bytes();
        let log_idx = (field_idx - HEADER_LOGS_BLOOM_FIELD_IDX_OFFSET) * 32;
        let bloom_bytes = &bloom[log_idx..log_idx + 32];
        return Ok(H256::from_slice(bloom_bytes));
    }
    let header_field_idx = HeaderField::from_usize(field_idx).expect("Invalid field index");
    let val = match header_field_idx {
        HeaderField::ParentHash => block.parent_hash,
        HeaderField::Sha3Uncles => block.uncles_hash,
        HeaderField::Miner => H256::from_slice(block.author.unwrap().as_bytes()),
        HeaderField::StateRoot => block.state_root,
        HeaderField::TransactionsRoot => block.transactions_root,
        HeaderField::ReceiptsRoot => block.receipts_root,
        HeaderField::LogsBloom => {
            let logs_bloom = block.logs_bloom.unwrap();
            H256::from(pad_to_bytes32(logs_bloom.as_fixed_bytes()))
        }
        HeaderField::Difficulty => H256::from_uint(&block.difficulty),
        HeaderField::Number => H256::from_low_u64_be(block.number.unwrap().as_u64()),
        HeaderField::GasLimit => H256::from_uint(&block.gas_limit),
        HeaderField::GasUsed => H256::from_uint(&block.gas_used),
        HeaderField::Timestamp => H256::from_uint(&block.timestamp),
        HeaderField::ExtraData => {
            let extra_data = block.extra_data;
            H256::from(pad_to_bytes32(&extra_data))
        }
        HeaderField::MixHash => block.mix_hash.unwrap(),
        HeaderField::Nonce => H256::from_slice(&block.nonce.unwrap().to_fixed_bytes()),
        HeaderField::BaseFeePerGas => H256::from_uint(&block.base_fee_per_gas.unwrap()),
        HeaderField::WithdrawalsRoot => block.withdrawals_root.unwrap(),
        HeaderField::Hash => block.hash.unwrap(),
        HeaderField::Size => H256::from_uint(&block.size.unwrap()),
        HeaderField::ExtraDataLen => H256::from_low_u64_be(block.extra_data.len() as u64),
    };

    Ok(val)
}

impl<F: Field> FetchSubquery<F> for AssignedHeaderSubquery<F> {
    fn fetch<P: JsonRpcClient>(&self, p: &Provider<P>) -> Result<H256> {
        let rt = Runtime::new()?;
        let val = rt.block_on(get_header_field_value(p, (*self).into()))?;
        Ok(val)
    }

    fn any_subquery(&self) -> AnySubquery {
        AnySubquery::Header((*self).into())
    }

    fn flatten(&self) -> Vec<AssignedValue<F>> {
        vec![self.block_number, self.field_idx]
    }
}

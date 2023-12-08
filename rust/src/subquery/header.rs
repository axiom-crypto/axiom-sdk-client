use anyhow::{bail, Result};
use axiom_codec::{
    special_values::{
        HEADER_EXTRA_DATA_LEN_FIELD_IDX, HEADER_HASH_FIELD_IDX, HEADER_LOGS_BLOOM_FIELD_IDX_OFFSET,
        HEADER_SIZE_FIELD_IDX,
    },
    types::native::{AnySubquery, HeaderSubquery},
};
use axiom_eth::{Field, halo2_base::AssignedValue};
use ethers::{
    providers::{JsonRpcClient, Middleware, Provider},
    types::{BigEndianHash, BlockId, H256},
};
use tokio::runtime::Runtime;

use super::{caller::FetchSubquery, utils::{usize_to_u8_array, pad_to_bytes32}, types::AssignedHeaderSubquery};
use num_derive::FromPrimitive;
use num_traits::FromPrimitive;

#[derive(FromPrimitive)]
pub enum HeaderFields {
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
    Size = HEADER_SIZE_FIELD_IDX as isize,
    ExtraDataLen = HEADER_EXTRA_DATA_LEN_FIELD_IDX as isize,
}

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
    let header_field_idx = HeaderFields::from_usize(field_idx).expect("Invalid field index");
    let val = match header_field_idx {
        HeaderFields::ParentHash => block.parent_hash,
        HeaderFields::Sha3Uncles => block.uncles_hash,
        HeaderFields::Miner => H256::from_slice(block.author.unwrap().as_bytes()),
        HeaderFields::StateRoot => block.state_root,
        HeaderFields::TransactionsRoot => block.transactions_root,
        HeaderFields::ReceiptsRoot => block.receipts_root,
        HeaderFields::LogsBloom => {
            let logs_bloom = block.logs_bloom.unwrap();
            H256::from(pad_to_bytes32(logs_bloom.as_fixed_bytes()))
        }
        HeaderFields::Difficulty => H256::from_uint(&block.difficulty),
        HeaderFields::Number => H256::from(usize_to_u8_array(block.number.unwrap().as_usize())),
        HeaderFields::GasLimit => H256::from_uint(&block.gas_limit),
        HeaderFields::GasUsed => H256::from_uint(&block.gas_used),
        HeaderFields::Timestamp => H256::from_uint(&block.timestamp),
        HeaderFields::ExtraData => {
            let extra_data = block.extra_data;
            H256::from(pad_to_bytes32(&extra_data))
        }
        HeaderFields::MixHash => block.mix_hash.unwrap(),
        HeaderFields::Nonce => H256::from_slice(&block.nonce.unwrap().to_fixed_bytes()),
        HeaderFields::BaseFeePerGas => H256::from_uint(&block.base_fee_per_gas.unwrap()),
        HeaderFields::WithdrawalsRoot => block.withdrawals_root.unwrap(),
        HeaderFields::Hash => block.hash.unwrap(),
        HeaderFields::Size => H256::from_uint(&block.size.unwrap()),
        HeaderFields::ExtraDataLen => H256::from(usize_to_u8_array(block.extra_data.len())),
    };

    Ok(val)
}

impl<F: Field> FetchSubquery<F> for AssignedHeaderSubquery<F> {
    fn fetch<P: JsonRpcClient>(&self, p: &Provider<P>) -> Result<(H256, Vec<AssignedValue<F>>)> {
        let rt = Runtime::new()?;
        let val = rt.block_on(get_header_field_value(p, (*self).into()))?;
        let flattened = vec![self.block_number, self.field_idx];
        Ok((val, flattened))
    }

    fn any_subquery(&self) -> AnySubquery {
        AnySubquery::Header((*self).into())
    }
}

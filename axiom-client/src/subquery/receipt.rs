use anyhow::{bail, Result};
use axiom_codec::{
    special_values::{
        RECEIPT_ADDRESS_IDX, RECEIPT_BLOCK_NUMBER_FIELD_IDX, RECEIPT_DATA_IDX_OFFSET,
        RECEIPT_LOGS_BLOOM_IDX_OFFSET, RECEIPT_LOG_IDX_OFFSET, RECEIPT_TX_INDEX_FIELD_IDX,
        RECEIPT_TX_TYPE_FIELD_IDX,
    },
    types::native::{AnySubquery, ReceiptSubquery},
};
use axiom_query::axiom_eth::{halo2_base::AssignedValue, Field};
use ethers::{
    providers::{JsonRpcClient, Middleware, Provider},
    types::{BigEndianHash, BlockId, H256},
};
use num_derive::FromPrimitive;
use num_traits::FromPrimitive;
use tokio::runtime::Runtime;

use super::{caller::FetchSubquery, types::AssignedReceiptSubquery, utils::pad_to_bytes32};
use crate::impl_fr_from;

#[derive(FromPrimitive)]
pub enum ReceiptField {
    Status,    // status for post EIP-658
    PostState, // postState for pre EIP-658
    CumulativeGas,
    LogsBloom,
    Logs,
    TxType = RECEIPT_TX_TYPE_FIELD_IDX as isize,
    BlockNumber = RECEIPT_BLOCK_NUMBER_FIELD_IDX as isize,
    TxIndex = RECEIPT_TX_INDEX_FIELD_IDX as isize,
}
impl_fr_from!(ReceiptField);

pub async fn get_receipt_field_value<P: JsonRpcClient>(
    provider: &Provider<P>,
    query: ReceiptSubquery,
) -> Result<H256> {
    let block_id = BlockId::from(query.block_number as u64);
    let tx = provider
        .get_transaction_by_block_and_index(block_id, query.tx_idx.into())
        .await?;
    let tx_hash = tx.unwrap().hash;
    let receipt = provider.get_transaction_receipt(tx_hash).await?.unwrap();
    //todo: check receipt size
    let field_or_log_idx = query.field_or_log_idx as usize;
    if (RECEIPT_LOGS_BLOOM_IDX_OFFSET..RECEIPT_LOGS_BLOOM_IDX_OFFSET + 8)
        .contains(&field_or_log_idx)
    {
        let bloom = receipt.logs_bloom.to_fixed_bytes();
        let log_idx = (field_or_log_idx - RECEIPT_LOGS_BLOOM_IDX_OFFSET) * 32;
        return Ok(H256::from_slice(&bloom[log_idx..log_idx + 32]));
    }

    if field_or_log_idx >= RECEIPT_LOG_IDX_OFFSET {
        let log_idx = field_or_log_idx - RECEIPT_LOG_IDX_OFFSET;
        if log_idx >= receipt.logs.len() {
            bail!("Log does not exist")
        }
        let log = receipt.logs[log_idx].clone();
        let topics = log.topics;
        if query.event_schema != H256::zero() && query.event_schema != topics[0] {
            bail!("Log does not match event schema")
        }

        let topic_or_data_or_address_idx = query.topic_or_data_or_address_idx as usize;

        if topic_or_data_or_address_idx == RECEIPT_ADDRESS_IDX {
            return Ok(log.address.into());
        } else if topic_or_data_or_address_idx < RECEIPT_DATA_IDX_OFFSET {
            if topic_or_data_or_address_idx > topics.len() {
                bail!("Topic does not exist")
            }

            if topic_or_data_or_address_idx < topics.len() {
                return Ok(topics[topic_or_data_or_address_idx]);
            }

            if topic_or_data_or_address_idx == topics.len() {
                return Ok(log.address.into());
            }
        } else {
            let data_idx = topic_or_data_or_address_idx - RECEIPT_DATA_IDX_OFFSET;
            if data_idx >= log.data.len() / 32 {
                bail!("Data does not exist")
            }
            let data_bytes = &log.data[data_idx * 32..(data_idx + 1) * 32];
            return Ok(H256::from_slice(data_bytes));
        }
    }

    let receipt_field_idx =
        ReceiptField::from_usize(field_or_log_idx).expect("Invalid field index");
    let val = match receipt_field_idx {
        ReceiptField::Status => H256::from_low_u64_be(receipt.status.unwrap().as_u64()),
        ReceiptField::PostState => receipt.root.unwrap(),
        ReceiptField::CumulativeGas => H256::from_uint(&receipt.cumulative_gas_used),
        ReceiptField::LogsBloom => {
            let logs_bloom = receipt.logs_bloom;
            H256::from(pad_to_bytes32(logs_bloom.as_fixed_bytes()))
        }
        ReceiptField::Logs => {
            bail!("Use log idx instead of logs field")
        }
        ReceiptField::TxType => H256::from_low_u64_be(receipt.transaction_type.unwrap().as_u64()),
        ReceiptField::BlockNumber => H256::from_low_u64_be(receipt.block_number.unwrap().as_u64()),
        ReceiptField::TxIndex => H256::from_low_u64_be(receipt.transaction_index.as_u64()),
    };

    Ok(val)
}

impl<F: Field> FetchSubquery<F> for AssignedReceiptSubquery<F> {
    fn fetch<P: JsonRpcClient>(&self, p: &Provider<P>) -> Result<H256> {
        let rt = Runtime::new()?;
        let val = rt.block_on(get_receipt_field_value(p, (*self).into()))?;
        Ok(val)
    }

    fn any_subquery(&self) -> AnySubquery {
        AnySubquery::Receipt((*self).into())
    }

    fn flatten(&self) -> Vec<AssignedValue<F>> {
        vec![
            self.block_number,
            self.tx_idx,
            self.field_or_log_idx,
            self.topic_or_data_or_address_idx,
            self.event_schema.hi(),
            self.event_schema.lo(),
        ]
    }
}

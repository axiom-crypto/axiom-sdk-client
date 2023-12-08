use anyhow::{bail, Result};
use axiom_codec::{
    special_values::{
        TX_BLOCK_NUMBER_FIELD_IDX, TX_CALLDATA_HASH_FIELD_IDX, TX_CALLDATA_IDX_OFFSET,
        TX_CONTRACT_DATA_IDX_OFFSET, TX_CONTRACT_DEPLOY_SELECTOR_VALUE, TX_DATA_LENGTH_FIELD_IDX,
        TX_FUNCTION_SELECTOR_FIELD_IDX, TX_NO_CALLDATA_SELECTOR_VALUE, TX_TX_INDEX_FIELD_IDX,
        TX_TX_TYPE_FIELD_IDX,
    },
    types::native::{AnySubquery, TxSubquery},
};
use axiom_eth::{halo2_base::AssignedValue, Field};
use ethers::{
    providers::{JsonRpcClient, Middleware, Provider},
    types::{BigEndianHash, BlockId, H256, U64},
    utils::keccak256,
};
use num_derive::FromPrimitive;
use num_traits::FromPrimitive;
use tokio::runtime::Runtime;

use super::{
    caller::FetchSubquery,
    types::AssignedTxSubquery,
    utils::{h256_from_usize, pad_to_bytes32},
};

#[derive(FromPrimitive)]
pub enum TxField {
    ChainId,
    Nonce,
    MaxPriorityFeePerGas,
    MaxFeePerGas,
    GasLimit,
    To,
    Value,
    Data,
    GasPrice,
    V,
    R,
    S,
    TxType = TX_TX_TYPE_FIELD_IDX as isize,
    BlockNumber = TX_BLOCK_NUMBER_FIELD_IDX as isize,
    TxIndex = TX_TX_INDEX_FIELD_IDX as isize,
    FunctionSelector = TX_FUNCTION_SELECTOR_FIELD_IDX as isize,
    CalldataHash = TX_CALLDATA_HASH_FIELD_IDX as isize,
    DataLength = TX_DATA_LENGTH_FIELD_IDX as isize,
}

pub async fn get_tx_field_value<P: JsonRpcClient>(
    provider: &Provider<P>,
    query: TxSubquery,
) -> Result<H256> {
    let block_id = BlockId::from(query.block_number as u64);
    let tx = provider
        .get_transaction_by_block_and_index(block_id, U64::from(query.tx_idx))
        .await;
    if tx.is_err() {
        bail!("Provider Error: Couldn't Fetch Tx")
    }
    let tx = tx.unwrap();
    if tx.is_none() {
        bail!("Transaction does not exist")
    }
    let tx = tx.unwrap();
    //todo: validate tx size

    if query.field_or_calldata_idx < TX_CONTRACT_DATA_IDX_OFFSET.try_into().unwrap() {
        let calldata = tx.input;

        let calldata_idx = (query.field_or_calldata_idx as usize) - TX_CALLDATA_IDX_OFFSET;
        if calldata_idx >= (calldata.len() - 4) / 32 {
            bail!("Invalid calldata index")
        }
        let calldata_bytes = &calldata[4 + calldata_idx * 32..4 + (calldata_idx + 1) * 32];
        return Ok(H256::from_slice(calldata_bytes));
    }

    if query.field_or_calldata_idx >= TX_CONTRACT_DATA_IDX_OFFSET.try_into().unwrap() {
        let contract_data = tx.input;
        let contract_data_idx =
            (query.field_or_calldata_idx as usize) - TX_CONTRACT_DATA_IDX_OFFSET;
        let num_slots = usize::div_ceil(contract_data.len(), 32);
        if contract_data_idx == num_slots - 1 {
            let contract_data_bytes = &contract_data[contract_data_idx * 32..];
            let padded = pad_to_bytes32(contract_data_bytes);
            return Ok(H256::from(padded));
        }
        let contract_data_bytes =
            &contract_data[contract_data_idx * 32..(contract_data_idx + 1) * 32];
        return Ok(H256::from_slice(contract_data_bytes));
    }

    let tx_field_idx = TxField::from_u32(query.field_or_calldata_idx).expect("Invalid field index");

    let val = match tx_field_idx {
        TxField::ChainId => H256::from_uint(&tx.chain_id.unwrap()),
        TxField::Nonce => H256::from_uint(&tx.nonce),
        TxField::MaxPriorityFeePerGas => H256::from_uint(&tx.max_priority_fee_per_gas.unwrap()),
        TxField::MaxFeePerGas => H256::from_uint(&tx.max_fee_per_gas.unwrap()),
        TxField::GasLimit => H256::from_uint(&tx.gas),
        TxField::To => H256::from(tx.to.unwrap()),
        TxField::Value => H256::from_uint(&tx.value),
        TxField::Data => {
            let padded = pad_to_bytes32(&tx.input);
            H256::from(padded)
        }
        TxField::GasPrice => {
            if tx.transaction_type.unwrap() == 2.into() {
                bail!("Gas Price not available for EIP-1559 transactions")
            }
            let gas_price = tx.gas_price.unwrap();
            H256::from_uint(&gas_price)
        }
        TxField::V => h256_from_usize(tx.v.as_usize()),
        TxField::R => H256::from_uint(&tx.r),
        TxField::S => H256::from_uint(&tx.s),
        TxField::TxType => h256_from_usize(tx.transaction_type.unwrap().as_usize()),
        TxField::BlockNumber => h256_from_usize(tx.block_number.unwrap().as_usize()),
        TxField::TxIndex => h256_from_usize(tx.transaction_index.unwrap().as_usize()),
        TxField::FunctionSelector => {
            let calldata = tx.input;
            let to = tx.to;

            if calldata.len() == 0 {
                h256_from_usize(TX_NO_CALLDATA_SELECTOR_VALUE)
            } else if calldata.len() > 0 && to.is_none() {
                h256_from_usize(TX_CONTRACT_DEPLOY_SELECTOR_VALUE)
            } else {
                if calldata.len() < 4 {
                    bail!("Invalid calldata")
                }
                let selector = &calldata[0..4];
                H256::from(pad_to_bytes32(selector))
            }
        }
        TxField::CalldataHash => {
            let calldata = tx.input;
            let hash = keccak256(&calldata);
            H256::from(hash)
        }
        TxField::DataLength => h256_from_usize(tx.input.len()),
    };
    Ok(val)
}

impl<F: Field> FetchSubquery<F> for AssignedTxSubquery<F> {
    fn fetch<P: JsonRpcClient>(&self, p: &Provider<P>) -> Result<(H256, Vec<AssignedValue<F>>)> {
        let rt = Runtime::new()?;
        let val = rt.block_on(get_tx_field_value(p, (*self).into()))?;
        let flattened = vec![self.block_number, self.tx_idx, self.field_or_calldata_idx];
        Ok((val, flattened))
    }

    fn any_subquery(&self) -> AnySubquery {
        AnySubquery::Transaction((*self).into())
    }
}

use anyhow::Result;
use axiom_codec::types::native::{AccountSubquery, AnySubquery};
use axiom_query::axiom_eth::{halo2_base::AssignedValue, Field};
use ethers::{
    providers::{JsonRpcClient, Middleware, Provider},
    types::{BigEndianHash, BlockId, H256, U256},
};
use num_derive::FromPrimitive;
use num_traits::FromPrimitive;
use tokio::runtime::Runtime;

use super::{caller::FetchSubquery, types::AssignedAccountSubquery};
use crate::impl_fr_from;

#[derive(FromPrimitive, Copy, Clone)]
pub enum AccountField {
    Nonce,
    Balance,
    StorageHash,
    CodeHash,
}
impl_fr_from!(AccountField);

pub async fn get_account_field_value<P: JsonRpcClient>(
    provider: &Provider<P>,
    query: AccountSubquery,
) -> Result<H256> {
    let block_id = Some(BlockId::from(query.block_number as u64));

    let account_field = AccountField::from_u32(query.field_idx).expect("Invalid field index");
    let val = match account_field {
        AccountField::Nonce => {
            let nonce = provider.get_transaction_count(query.addr, block_id).await;
            if nonce.is_err() {
                return Ok(get_nonexistent_account_field_value(
                    query.field_idx as usize,
                ));
            }
            H256::from_uint(&nonce.unwrap())
        }
        AccountField::Balance => {
            let balance = provider.get_balance(query.addr, block_id).await;
            if balance.is_err() {
                return Ok(get_nonexistent_account_field_value(
                    query.field_idx as usize,
                ));
            }
            H256::from_uint(&balance.unwrap())
        }
        AccountField::StorageHash => {
            let proof = provider.get_proof(query.addr, vec![], block_id).await;
            if proof.is_err() {
                return Ok(get_nonexistent_account_field_value(
                    query.field_idx as usize,
                ));
            }
            proof.unwrap().storage_hash
        }
        AccountField::CodeHash => {
            let proof = provider.get_proof(query.addr, vec![], block_id).await;
            if proof.is_err() {
                return Ok(get_nonexistent_account_field_value(
                    query.field_idx as usize,
                ));
            }
            proof.unwrap().code_hash
        }
    };

    Ok(val)
}

impl<F: Field> FetchSubquery<F> for AssignedAccountSubquery<F> {
    fn fetch<P: JsonRpcClient>(&self, p: &Provider<P>) -> Result<H256> {
        let rt = Runtime::new()?;
        let res = rt.block_on(get_account_field_value(p, (*self).into()))?;
        Ok(res)
    }

    fn any_subquery(&self) -> AnySubquery {
        AnySubquery::Account((*self).into())
    }

    fn flatten(&self) -> Vec<AssignedValue<F>> {
        vec![self.block_number, self.addr, self.field_idx]
    }
}

fn get_nonexistent_account_field_value(field_idx: usize) -> H256 {
    let account_field = AccountField::from_usize(field_idx).expect("Invalid field index");
    match account_field {
        AccountField::Nonce => H256::from_uint(&U256::from(0)),
        AccountField::Balance => H256::from_uint(&U256::from(0)),
        AccountField::StorageHash => H256::from_uint(
            &U256::from_dec_str(
                "0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421",
            )
            .unwrap(),
        ),
        AccountField::CodeHash => H256::from_uint(&U256::from(0)),
    }
}

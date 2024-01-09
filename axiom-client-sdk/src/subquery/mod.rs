// use axiom_client::{
//     axiom_codec::constants::MAX_SOLIDITY_MAPPING_KEYS,
//     axiom_eth::{halo2_base::AssignedValue, utils::hilo::HiLo},
//     subquery::{account::AccountField, header::HeaderField},
// };

// use crate::Fr;

// pub trait SubqueryCall {
//     fn call(&self) -> HiLo<AssignedValue<Fr>>;
// }

// #[derive(Clone)]
// pub struct HeaderSubquery {
//     pub block_number: AssignedValue<Fr>,
//     pub field_idx: HeaderField,
// }

// #[derive(Clone)]
// pub struct AccountSubquery {
//     pub block_number: AssignedValue<Fr>,
//     pub addr: AssignedValue<Fr>,
//     pub field_idx: AccountField,
// }

// #[derive(Clone)]
// pub struct StorageSubquery {
//     pub block_number: AssignedValue<Fr>,
//     pub addr: AssignedValue<Fr>,
//     pub slot: HiLo<AssignedValue<Fr>>,
// }

// #[derive(Clone)]
// pub struct TxSubquery {
//     pub block_number: AssignedValue<Fr>,
//     pub tx_idx: AssignedValue<Fr>,
//     pub field_or_calldata_idx: AssignedValue<Fr>,
// }

// #[derive(Clone)]
// pub struct ReceiptSubquery {
//     pub block_number: AssignedValue<Fr>,
//     pub tx_idx: AssignedValue<Fr>,
//     pub field_or_log_idx: AssignedValue<Fr>,
//     pub topic_or_data_or_address_idx: AssignedValue<Fr>,
//     pub event_schema: HiLo<AssignedValue<Fr>>,
// }

// #[derive(Clone)]
// pub struct SolidityNestedMappingSubquery {
//     pub block_number: AssignedValue<Fr>,
//     pub addr: AssignedValue<Fr>,
//     pub mapping_slot: HiLo<AssignedValue<Fr>>,
//     pub mapping_depth: AssignedValue<Fr>,
//     pub keys: [HiLo<AssignedValue<Fr>>; MAX_SOLIDITY_MAPPING_KEYS],
// }

pub mod account;
pub mod header;
pub mod mapping;
pub mod receipt;
pub mod storage;
pub mod tx;

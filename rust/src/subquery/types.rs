use axiom_codec::{
    constants::MAX_SOLIDITY_MAPPING_KEYS,
    types::native::{
        AccountSubquery, HeaderSubquery, ReceiptSubquery, SolidityNestedMappingSubquery,
        StorageSubquery, TxSubquery
    }, HiLo,
};
use axiom_eth::{halo2_base::AssignedValue, Field};
use ethers::types::BigEndianHash;

use super::utils::{fe_to_h160, hi_lo_fe_to_h256};

#[derive(Clone, Copy)]
pub struct AssignedHeaderSubquery<F: Field> {
    pub block_number: AssignedValue<F>,
    pub field_idx: AssignedValue<F>,
}

impl<F: Field> From<AssignedHeaderSubquery<F>> for HeaderSubquery {
    fn from(subquery: AssignedHeaderSubquery<F>) -> Self {
        Self {
            block_number: subquery.block_number.value().get_lower_32(),
            field_idx: subquery.field_idx.value().get_lower_32(),
        }
    }
}

#[derive(Clone, Copy)]
pub struct AssignedAccountSubquery<F: Field> {
    pub block_number: AssignedValue<F>,
    pub addr: AssignedValue<F>,
    pub field_idx: AssignedValue<F>,
}

impl<F: Field> From<AssignedAccountSubquery<F>> for AccountSubquery {
    fn from(subquery: AssignedAccountSubquery<F>) -> Self {
        Self {
            block_number: subquery.block_number.value().get_lower_32(),
            field_idx: subquery.field_idx.value().get_lower_32(),
            addr: fe_to_h160(subquery.addr.value()),
        }
    }
}

#[derive(Clone, Copy)]
pub struct AssignedStorageSubquery<F: Field> {
    pub block_number: AssignedValue<F>,
    pub addr: AssignedValue<F>,
    pub slot: HiLo<AssignedValue<F>>,
}

impl<F: Field> From<AssignedStorageSubquery<F>> for StorageSubquery {
    fn from(subquery: AssignedStorageSubquery<F>) -> Self {
        let hi = subquery.slot.hi();
        let lo = subquery.slot.lo();
        let slot = hi_lo_fe_to_h256(hi.value(), lo.value());
        Self {
            block_number: subquery.block_number.value().get_lower_32(),
            addr: fe_to_h160(subquery.addr.value()),
            slot: slot.into_uint(),
        }
    }
}

#[derive(Clone, Copy)]
pub struct AssignedTxSubquery<F: Field> {
    pub block_number: AssignedValue<F>,
    pub tx_idx: AssignedValue<F>,
    pub field_or_calldata_idx: AssignedValue<F>,
}

impl<F: Field> From<AssignedTxSubquery<F>> for TxSubquery {
    fn from(subquery: AssignedTxSubquery<F>) -> Self {
        Self {
            block_number: subquery.block_number.value().get_lower_32(),
            tx_idx: subquery.tx_idx.value().get_lower_32() as u16,
            field_or_calldata_idx: subquery.field_or_calldata_idx.value().get_lower_32(),
        }
    }
}

#[derive(Clone, Copy)]
pub struct AssignedReceiptSubquery<F: Field> {
    pub block_number: AssignedValue<F>,
    pub tx_idx: AssignedValue<F>,
    pub field_or_log_idx: AssignedValue<F>,
    pub topic_or_data_or_address_idx: AssignedValue<F>,
    pub event_schema: HiLo<AssignedValue<F>>,
}

impl<F: Field> From<AssignedReceiptSubquery<F>> for ReceiptSubquery {
    fn from(subquery: AssignedReceiptSubquery<F>) -> Self {
        let hi = subquery.event_schema.hi();
        let lo = subquery.event_schema.lo();
        let event_schema = hi_lo_fe_to_h256(hi.value(), lo.value());
        Self {
            block_number: subquery.block_number.value().get_lower_32(),
            tx_idx: subquery.tx_idx.value().get_lower_32() as u16,
            field_or_log_idx: subquery.field_or_log_idx.value().get_lower_32(),
            topic_or_data_or_address_idx: subquery
                .topic_or_data_or_address_idx
                .value()
                .get_lower_32(),
            event_schema,
        }
    }
}

#[derive(Clone, Copy)]
pub struct AssignedSolidityNestedMappingSubquery<F: Field> {
    pub block_number: AssignedValue<F>,
    pub addr: AssignedValue<F>,
    pub mapping_slot: HiLo<AssignedValue<F>>,
    pub mapping_depth: AssignedValue<F>,
    pub keys: [HiLo<AssignedValue<F>>; MAX_SOLIDITY_MAPPING_KEYS],
}

impl<F: Field> From<AssignedSolidityNestedMappingSubquery<F>> for SolidityNestedMappingSubquery {
    fn from(subquery: AssignedSolidityNestedMappingSubquery<F>) -> Self {
        let hi = subquery.mapping_slot.hi();
        let lo = subquery.mapping_slot.lo();
        let mapping_slot = hi_lo_fe_to_h256(hi.value(), lo.value());
        let keys = subquery
            .keys
            .iter()
            .map(|key| {
                let hi = key.hi();
                let lo = key.lo();
                hi_lo_fe_to_h256(hi.value(), lo.value())
            })
            .collect();
        Self {
            block_number: subquery.block_number.value().get_lower_32(),
            addr: fe_to_h160(subquery.addr.value()),
            mapping_slot: mapping_slot.into_uint(),
            mapping_depth: subquery.mapping_depth.value().get_lower_32() as u8,
            keys,
        }
    }
}

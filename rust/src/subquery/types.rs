use axiom_codec::{
    constants::MAX_SOLIDITY_MAPPING_KEYS,
    types::native::{
        AccountSubquery, AnySubquery, HeaderSubquery, ReceiptSubquery,
        SolidityNestedMappingSubquery, StorageSubquery, TxSubquery,
    },
    utils::native::decode_hilo_to_h256,
    HiLo,
};
use axiom_eth::{halo2_base::AssignedValue, Field};
use ethers::types::{BigEndianHash, H256};
use serde::{Serialize, Serializer};

use super::utils::{fe_to_h160, get_subquery_type_from_any_subquery};

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
        let hilo = HiLo::from_hi_lo([*hi.value(), *lo.value()]);
        let slot = decode_hilo_to_h256(hilo);
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
        let hilo = HiLo::from_hi_lo([*hi.value(), *lo.value()]);
        let event_schema = decode_hilo_to_h256(hilo);
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
        let hilo = HiLo::from_hi_lo([*hi.value(), *lo.value()]);
        let mapping_slot = decode_hilo_to_h256(hilo);
        let keys = subquery
            .keys
            .iter()
            .map(|key| {
                let hilo = HiLo::from_hi_lo([*key.hi().value(), *key.lo().value()]);
                decode_hilo_to_h256(hilo)
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

#[derive(Debug)]
pub(crate) struct Subquery(pub AnySubquery);
impl Serialize for Subquery {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        match self.0 {
            AnySubquery::Null => serializer.serialize_unit_variant("AnySubquery", 0, "Null"),
            AnySubquery::Header(ref inner) => inner.serialize(serializer),
            AnySubquery::Account(ref inner) => inner.serialize(serializer),
            AnySubquery::Storage(ref inner) => inner.serialize(serializer),
            AnySubquery::Transaction(ref inner) => inner.serialize(serializer),
            AnySubquery::Receipt(ref inner) => inner.serialize(serializer),
            AnySubquery::SolidityNestedMapping(ref inner) => inner.serialize(serializer),
        }
    }
}

#[derive(Debug, Serialize)]
pub struct RawSubquery {
    #[serde(rename = "subqueryData")]
    pub(crate) subquery_data: Subquery,
    #[serde(rename = "type")]
    pub(crate) subquery_type: u64,
}

impl From<AnySubquery> for RawSubquery {
    fn from(subquery: AnySubquery) -> Self {
        let subquery_type = get_subquery_type_from_any_subquery(&subquery);
        Self {
            subquery_data: Subquery(subquery),
            subquery_type,
        }
    }
}

#[derive(Debug, Serialize, Default)]
#[serde(rename_all = "camelCase")]
pub struct AxiomV2CircuitOutput {
    pub(crate) data_query: Vec<RawSubquery>,
    pub(crate) compute_results: Vec<H256>,
}

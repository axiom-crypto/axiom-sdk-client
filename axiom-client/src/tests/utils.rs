use std::{
    marker::PhantomData,
    str::FromStr,
    sync::{Arc, Mutex},
};

use axiom_codec::{constants::MAX_SOLIDITY_MAPPING_KEYS, HiLo};
use axiom_query::axiom_eth::{
    halo2_base::AssignedValue, halo2curves::bn256::Fr, rlc::circuit::builder::RlcCircuitBuilder,
    utils::encode_addr_to_field,
};
use ethers::{providers::JsonRpcClient, types::H160};

use crate::{
    constant, ctx,
    input::flatten::InputFlatten,
    subquery::{
        account::AccountField,
        caller::SubqueryCaller,
        header::HeaderField,
        receipt::ReceiptField,
        types::{
            AssignedAccountSubquery, AssignedHeaderSubquery, AssignedReceiptSubquery,
            AssignedSolidityNestedMappingSubquery, AssignedStorageSubquery, AssignedTxSubquery,
        },
    },
    witness,
};

#[derive(Debug, Clone, Default)]
pub struct EmptyCircuitInput<T: Copy>(PhantomData<T>);

impl<T: Copy> InputFlatten<T> for EmptyCircuitInput<T> {
    const NUM_FE: usize = 0;

    fn flatten_vec(&self) -> Vec<T> {
        vec![]
    }

    fn unflatten(_vec: Vec<T>) -> anyhow::Result<Self> {
        Ok(Self(PhantomData))
    }
}

pub fn account_call<P: JsonRpcClient>(
    builder: &mut RlcCircuitBuilder<Fr>,
    subquery_caller: Arc<Mutex<SubqueryCaller<P, Fr>>>,
) -> HiLo<AssignedValue<Fr>> {
    let subquery = AssignedAccountSubquery {
        block_number: witness!(builder, Fr::from(9730000)),
        field_idx: constant!(builder, Fr::from(AccountField::Balance)),
        addr: constant!(builder, Fr::from(0)),
    };
    let balance = subquery_caller
        .lock()
        .unwrap()
        .call(ctx!(builder, 0), subquery);
    balance
}

pub fn header_call<P: JsonRpcClient>(
    builder: &mut RlcCircuitBuilder<Fr>,
    subquery_caller: Arc<Mutex<SubqueryCaller<P, Fr>>>,
) -> HiLo<AssignedValue<Fr>> {
    let subquery = AssignedHeaderSubquery {
        block_number: witness!(builder, Fr::from(9730000)),
        field_idx: constant!(builder, Fr::from(HeaderField::GasLimit)),
    };
    let timestamp = subquery_caller
        .lock()
        .unwrap()
        .call(ctx!(builder, 0), subquery);
    timestamp
}

pub fn mapping_call<P: JsonRpcClient>(
    builder: &mut RlcCircuitBuilder<Fr>,
    subquery_caller: Arc<Mutex<SubqueryCaller<P, Fr>>>,
) -> HiLo<AssignedValue<Fr>> {
    let key_hi = witness!(builder, Fr::from(0));
    let key_lo = witness!(builder, Fr::from(3));
    let key = HiLo::from_hi_lo([key_hi, key_lo]);
    let mut keys = [key; MAX_SOLIDITY_MAPPING_KEYS];
    keys[1..MAX_SOLIDITY_MAPPING_KEYS].iter_mut().for_each(|k| {
        let hi = constant!(builder, Fr::from(0));
        let lo = constant!(builder, Fr::from(0));
        *k = HiLo::from_hi_lo([hi, lo])
    });

    let mapping_slot_hi = constant!(builder, Fr::from(0));
    let mapping_slot_lo = constant!(builder, Fr::from(1));

    let subquery = AssignedSolidityNestedMappingSubquery {
        block_number: witness!(builder, Fr::from(9730000)),
        addr: witness!(
            builder,
            encode_addr_to_field(
                &H160::from_str("0x8dde5d4a8384f403f888e1419672d94c570440c9").unwrap()
            )
        ),
        mapping_depth: constant!(builder, Fr::from(1)),
        mapping_slot: HiLo::from_hi_lo([mapping_slot_hi, mapping_slot_lo]),
        keys,
    };
    let val = subquery_caller
        .lock()
        .unwrap()
        .call(ctx!(builder, 0), subquery);

    val
}

pub fn receipt_call<P: JsonRpcClient>(
    builder: &mut RlcCircuitBuilder<Fr>,
    subquery_caller: Arc<Mutex<SubqueryCaller<P, Fr>>>,
) -> HiLo<AssignedValue<Fr>> {
    let subquery = AssignedReceiptSubquery {
        block_number: witness!(builder, Fr::from(9728956)),
        tx_idx: witness!(builder, Fr::from(10)),
        field_or_log_idx: witness!(builder, Fr::from(0)),
        topic_or_data_or_address_idx: constant!(builder, Fr::from(ReceiptField::PostState)),
        event_schema: HiLo::from_hi_lo([
            constant!(builder, Fr::from(0)),
            constant!(builder, Fr::from(0)),
        ]),
    };
    let val = subquery_caller
        .lock()
        .unwrap()
        .call(ctx!(builder, 0), subquery);
    val
}

pub fn storage_call<P: JsonRpcClient>(
    builder: &mut RlcCircuitBuilder<Fr>,
    subquery_caller: Arc<Mutex<SubqueryCaller<P, Fr>>>,
) -> HiLo<AssignedValue<Fr>> {
    let address = encode_addr_to_field(
        &H160::from_str("0x8dde5d4a8384f403f888e1419672d94c570440c9").unwrap(),
    );
    let subquery = AssignedStorageSubquery {
        block_number: witness!(builder, Fr::from(9730000)),
        addr: witness!(builder, address),
        slot: HiLo::from_hi_lo([
            witness!(builder, Fr::from(0)),
            witness!(builder, Fr::from(2)),
        ]),
    };
    let val = subquery_caller
        .lock()
        .unwrap()
        .call(ctx!(builder, 0), subquery);
    val
}

pub fn tx_call<P: JsonRpcClient>(
    builder: &mut RlcCircuitBuilder<Fr>,
    subquery_caller: Arc<Mutex<SubqueryCaller<P, Fr>>>,
) -> HiLo<AssignedValue<Fr>> {
    let subquery = AssignedTxSubquery {
        block_number: witness!(builder, Fr::from(9730000)),
        tx_idx: witness!(builder, Fr::from(10)),
        field_or_calldata_idx: constant!(builder, Fr::from(0)),
    };
    let val = subquery_caller
        .lock()
        .unwrap()
        .call(ctx!(builder, 0), subquery);
    val
}

pub fn all_subqueries_call<P: JsonRpcClient>(
    builder: &mut RlcCircuitBuilder<Fr>,
    subquery_caller: Arc<Mutex<SubqueryCaller<P, Fr>>>,
) -> Vec<HiLo<AssignedValue<Fr>>> {
    let vals = vec![
        account_call(builder, subquery_caller.clone()),
        header_call(builder, subquery_caller.clone()),
        mapping_call(builder, subquery_caller.clone()),
        receipt_call(builder, subquery_caller.clone()),
        storage_call(builder, subquery_caller.clone()),
        tx_call(builder, subquery_caller.clone()),
    ];
    vals
}

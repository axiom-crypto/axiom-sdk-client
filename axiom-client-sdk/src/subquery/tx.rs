use std::sync::{Arc, Mutex};

use axiom_client::{
    axiom_codec::{
        special_values::{TX_CALLDATA_IDX_OFFSET, TX_CONTRACT_DATA_IDX_OFFSET},
        HiLo,
    },
    axiom_eth::halo2_base::{
        gates::{GateChip, GateInstructions},
        AssignedValue, Context,
    },
    subquery::{caller::SubqueryCaller, types::AssignedTxSubquery, TxField},
};
use ethers::providers::Http;

use crate::Fr;

pub struct Tx<'a> {
    pub block_number: AssignedValue<Fr>,
    pub tx_idx: AssignedValue<Fr>,
    ctx: &'a mut Context<Fr>,
    caller: Arc<Mutex<SubqueryCaller<Http, Fr>>>,
}

pub fn get_tx(
    ctx: &mut Context<Fr>,
    caller: Arc<Mutex<SubqueryCaller<Http, Fr>>>,
    block_number: AssignedValue<Fr>,
    tx_idx: AssignedValue<Fr>,
) -> Tx {
    Tx {
        block_number,
        tx_idx,
        ctx,
        caller,
    }
}

impl<'a> Tx<'a> {
    pub fn call(self, field: TxField) -> HiLo<AssignedValue<Fr>> {
        let field_constant = self.ctx.load_constant(Fr::from(field));
        let mut subquery_caller = self.caller.lock().unwrap();
        let subquery = AssignedTxSubquery {
            block_number: self.block_number,
            tx_idx: self.tx_idx,
            field_or_calldata_idx: field_constant,
        };
        subquery_caller.call(self.ctx, subquery)
    }

    pub fn calldata(self, calldata_idx: AssignedValue<Fr>) -> HiLo<AssignedValue<Fr>> {
        let mut subquery_caller = self.caller.lock().unwrap();
        let calldata_offset = self
            .ctx
            .load_constant(Fr::from(TX_CALLDATA_IDX_OFFSET as u64));
        let gate = GateChip::new();
        let calldata_idx_with_offset = gate.add(self.ctx, calldata_idx, calldata_offset);
        let subquery = AssignedTxSubquery {
            block_number: self.block_number,
            tx_idx: self.tx_idx,
            field_or_calldata_idx: calldata_idx_with_offset,
        };
        subquery_caller.call(self.ctx, subquery)
    }

    pub fn contract_data(self, contract_data_idx: AssignedValue<Fr>) -> HiLo<AssignedValue<Fr>> {
        let mut subquery_caller = self.caller.lock().unwrap();
        let contract_data_offset = self
            .ctx
            .load_constant(Fr::from(TX_CONTRACT_DATA_IDX_OFFSET as u64));
        let gate = GateChip::new();
        let contract_data_idx_with_offset =
            gate.add(self.ctx, contract_data_idx, contract_data_offset);
        let subquery = AssignedTxSubquery {
            block_number: self.block_number,
            tx_idx: self.tx_idx,
            field_or_calldata_idx: contract_data_idx_with_offset,
        };
        subquery_caller.call(self.ctx, subquery)
    }
}

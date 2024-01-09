use std::sync::{Arc, Mutex};

use axiom_client::{
    axiom_codec::{
        special_values::{
            RECEIPT_ADDRESS_IDX, RECEIPT_DATA_IDX_OFFSET, RECEIPT_LOGS_BLOOM_IDX_OFFSET,
            RECEIPT_LOG_IDX_OFFSET,
        },
        HiLo,
    },
    axiom_eth::{
        halo2_base::{
            gates::{GateChip, GateInstructions},
            AssignedValue, Context,
        },
        utils::encode_h256_to_hilo,
    },
    subquery::{caller::SubqueryCaller, receipt::ReceiptField, types::AssignedReceiptSubquery},
};
use ethers::{providers::JsonRpcClient, types::H256};

use crate::Fr;

pub struct Receipt<'a, P: JsonRpcClient> {
    pub block_number: AssignedValue<Fr>,
    pub tx_idx: AssignedValue<Fr>,
    ctx: &'a mut Context<Fr>,
    caller: Arc<Mutex<SubqueryCaller<P, Fr>>>,
}

pub struct Log<'a, P: JsonRpcClient> {
    pub block_number: AssignedValue<Fr>,
    pub tx_idx: AssignedValue<Fr>,
    pub field_or_log_idx: AssignedValue<Fr>,
    ctx: &'a mut Context<Fr>,
    caller: Arc<Mutex<SubqueryCaller<P, Fr>>>,
}

pub fn get_receipt<P: JsonRpcClient>(
    ctx: &mut Context<Fr>,
    caller: Arc<Mutex<SubqueryCaller<P, Fr>>>,
    block_number: AssignedValue<Fr>,
    tx_idx: AssignedValue<Fr>,
) -> Receipt<P> {
    Receipt {
        block_number,
        tx_idx,
        ctx,
        caller,
    }
}

impl<'a, P: JsonRpcClient> Receipt<'a, P> {
    pub fn call(self, field: ReceiptField) -> HiLo<AssignedValue<Fr>> {
        let field_constant = self.ctx.load_constant(Fr::from(field));
        let mut subquery_caller = self.caller.lock().unwrap();
        let topic = self.ctx.load_constant(Fr::zero());
        let zero_event_schema = self.ctx.load_constants(&[Fr::zero(), Fr::zero()]);
        let event_schema = HiLo::from_hi_lo([zero_event_schema[0], zero_event_schema[1]]);
        let subquery = AssignedReceiptSubquery {
            block_number: self.block_number,
            tx_idx: self.tx_idx,
            field_or_log_idx: field_constant,
            topic_or_data_or_address_idx: topic,
            event_schema,
        };
        subquery_caller.call(self.ctx, subquery)
    }

    pub fn log(self, log_idx: AssignedValue<Fr>) -> Log<'a, P> {
        let log_offset = self
            .ctx
            .load_constant(Fr::from(RECEIPT_LOG_IDX_OFFSET as u64));
        let gate = GateChip::new();
        let log_idx_with_offset = gate.add(self.ctx, log_idx, log_offset);
        Log {
            block_number: self.block_number,
            tx_idx: self.tx_idx,
            field_or_log_idx: log_idx_with_offset,
            ctx: self.ctx,
            caller: self.caller,
        }
    }

    pub fn logs_bloom(self, logs_bloom_idx: usize) -> HiLo<AssignedValue<Fr>> {
        let mut subquery_caller = self.caller.lock().unwrap();
        if logs_bloom_idx >= 8 {
            panic!("logs_bloom_idx range is [0, 8)");
        }
        let field_idx = logs_bloom_idx + RECEIPT_LOGS_BLOOM_IDX_OFFSET;
        let assigned_field_idx = self.ctx.load_constant(Fr::from(field_idx as u64));
        let topic = self.ctx.load_constant(Fr::zero());
        let zero_event_schema = self.ctx.load_constants(&[Fr::zero(), Fr::zero()]);
        let event_schema = HiLo::from_hi_lo([zero_event_schema[0], zero_event_schema[1]]);
        let subquery = AssignedReceiptSubquery {
            block_number: self.block_number,
            field_or_log_idx: assigned_field_idx,
            tx_idx: self.tx_idx,
            topic_or_data_or_address_idx: topic,
            event_schema,
        };
        subquery_caller.call(self.ctx, subquery)
    }
}

impl<'a, P: JsonRpcClient> Log<'a, P> {
    pub fn topic(
        self,
        topic_idx: AssignedValue<Fr>,
        event_schema: Option<H256>,
    ) -> HiLo<AssignedValue<Fr>> {
        let mut subquery_caller = self.caller.lock().unwrap();
        let event_schema = event_schema.unwrap_or_else(H256::zero);
        let event_schema_hilo = encode_h256_to_hilo::<Fr>(&event_schema);
        let assigned_event_schema = self
            .ctx
            .load_constants(&[event_schema_hilo.hi(), event_schema_hilo.lo()]);
        let event_schema = HiLo::from_hi_lo([assigned_event_schema[0], assigned_event_schema[1]]);
        let subquery = AssignedReceiptSubquery {
            block_number: self.block_number,
            tx_idx: self.tx_idx,
            field_or_log_idx: self.field_or_log_idx,
            topic_or_data_or_address_idx: topic_idx,
            event_schema,
        };
        subquery_caller.call(self.ctx, subquery)
    }

    pub fn data(
        self,
        data_idx: AssignedValue<Fr>,
        event_schema: Option<H256>,
    ) -> HiLo<AssignedValue<Fr>> {
        let mut subquery_caller = self.caller.lock().unwrap();
        let event_schema = event_schema.unwrap_or_else(H256::zero);
        let event_schema_hilo = encode_h256_to_hilo::<Fr>(&event_schema);
        let assigned_event_schema = self
            .ctx
            .load_constants(&[event_schema_hilo.hi(), event_schema_hilo.lo()]);
        let event_schema = HiLo::from_hi_lo([assigned_event_schema[0], assigned_event_schema[1]]);
        let data_offset = self
            .ctx
            .load_constant(Fr::from(RECEIPT_DATA_IDX_OFFSET as u64));
        let gate = GateChip::new();
        let data_idx_with_offset = gate.add(self.ctx, data_idx, data_offset);
        let subquery = AssignedReceiptSubquery {
            block_number: self.block_number,
            tx_idx: self.tx_idx,
            field_or_log_idx: self.field_or_log_idx,
            topic_or_data_or_address_idx: data_idx_with_offset,
            event_schema,
        };
        subquery_caller.call(self.ctx, subquery)
    }

    pub fn address(self) -> HiLo<AssignedValue<Fr>> {
        let mut subquery_caller = self.caller.lock().unwrap();
        let topic = self.ctx.load_constant(Fr::from(RECEIPT_ADDRESS_IDX as u64));
        let zero_event_schema = self.ctx.load_constants(&[Fr::zero(), Fr::zero()]);
        let event_schema = HiLo::from_hi_lo([zero_event_schema[0], zero_event_schema[1]]);
        let subquery = AssignedReceiptSubquery {
            block_number: self.block_number,
            tx_idx: self.tx_idx,
            field_or_log_idx: self.field_or_log_idx,
            topic_or_data_or_address_idx: topic,
            event_schema,
        };
        subquery_caller.call(self.ctx, subquery)
    }
}

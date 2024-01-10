use std::{fmt::Debug, str::FromStr};

use axiom_client_sdk::{
    axiom::{AxiomAPI, AxiomComputeFn, AxiomResult},
    halo2_base::AssignedValue,
    subquery::{AccountField, HeaderField, TxField},
    AxiomComputeInput, Fr, HiLo,
};
use ethers::types::{Address, H256};

#[AxiomComputeInput]
pub struct QuickstartInput {
    pub block: u64,
    pub addr: Address,
    pub tx_block_number: u64,
    pub tx_idx: u64,
    pub slot: H256,
    pub mapping_slot: H256,
}

impl AxiomComputeFn for QuickstartInput {
    fn compute(
        api: &mut AxiomAPI,
        assigned_inputs: QuickstartCircuitInput<AssignedValue<Fr>>,
    ) -> Vec<AxiomResult> {
        // fetch block header data
        // access the timestamp field
        let _timestamp = api
            .get_header(assigned_inputs.block)
            .call(HeaderField::Timestamp);
        // access the gasLimit field
        let _gas_limit = api
            .get_header(assigned_inputs.block)
            .call(HeaderField::GasLimit);

        // fetch account data
        // access the account balance
        let _balance = api
            .get_account(assigned_inputs.block, assigned_inputs.addr)
            .call(AccountField::Balance);
        // access the account nonce
        let _nonce = api
            .get_account(assigned_inputs.block, assigned_inputs.addr)
            .call(AccountField::Nonce);

        //fetch storage data
        let storage = api.get_storage(assigned_inputs.block, assigned_inputs.addr);
        let _slot_val = storage.slot(assigned_inputs.slot);

        //fetch Solidity mapping data
        let key = [0, 3].map(|i| api.ctx().load_constant(Fr::from(i)));
        let mapping = api.get_mapping(
            assigned_inputs.block,
            assigned_inputs.addr,
            assigned_inputs.mapping_slot,
        );
        let _mapping_val = mapping.key(HiLo::from_hi_lo(key));

        // fetch transaction data, example is for the transaction below:
        // https://goerli.etherscan.io/tx/0xa4f781ad033d6dab5b13e3ab7c7cbdbd0ea4c0a2be3d9ffa7ed1e53d2d5bcc46
        // get the 4-byte function selector that was called
        let _function_selector = api
            .get_tx(assigned_inputs.tx_block_number, assigned_inputs.tx_idx)
            .call(TxField::FunctionSelector);
        // access bytes [32, 64) of calldata
        let calldata_idx = api.ctx().load_constant(Fr::from(1));
        let _calldata = api
            .get_tx(assigned_inputs.tx_block_number, assigned_inputs.tx_idx)
            .calldata(calldata_idx);

        // fetch receipt data, example is for the first event log in the transaction below
        // Deposit (index_topic_1 address payor, uint256 amt)
        // https://goerli.etherscan.io/tx/0xa4f781ad033d6dab5b13e3ab7c7cbdbd0ea4c0a2be3d9ffa7ed1e53d2d5bcc46
        // eventSchema = keccak(Deposit(address,uint256))
        let event_schema =
            H256::from_str("0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c")
                .unwrap();
        let log_idx = api.ctx().load_constant(Fr::from(0));
        let topic_idx = api.ctx().load_constant(Fr::from(1));
        let data_idx = api.ctx().load_constant(Fr::from(0));
        // access the address that emitted the log event at index 0
        let _addr = api
            .get_receipt(assigned_inputs.tx_block_number, assigned_inputs.tx_idx)
            .log(log_idx)
            .address();
        // access the topic at index 1 of the log event at index 0 and check it has schema eventSchema
        // because `address` is indexed in the event, this corresponds to `address`
        let _topic = api
            .get_receipt(assigned_inputs.tx_block_number, assigned_inputs.tx_idx)
            .log(log_idx)
            .topic(topic_idx, Some(event_schema));
        // access the first 32 bytes of data in the log event at index 0
        // because `amt` is not indexed, this corresponds to `amt`
        let _data = api
            .get_receipt(assigned_inputs.tx_block_number, assigned_inputs.tx_idx)
            .log(log_idx)
            .data(data_idx, Some(event_schema));

        vec![]
    }
}

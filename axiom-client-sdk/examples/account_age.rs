use std::fmt::Debug;

use axiom_client_sdk::{
    axiom::{AxiomAPI, AxiomComputeFn, AxiomResult},
    halo2_base::{
        gates::{GateChip, GateInstructions, RangeInstructions},
        AssignedValue,
    },
    subquery::AccountField,
    AxiomComputeInput, Fr,
};
use ethers::types::Address;

#[AxiomComputeInput]
pub struct AccountAgeInput {
    pub addr: Address,
    pub claimed_block_number: u64,
}

impl AxiomComputeFn for AccountAgeInput {
    fn compute(
        api: &mut AxiomAPI,
        assigned_inputs: AccountAgeCircuitInput<AssignedValue<Fr>>,
    ) -> Vec<AxiomResult> {
        let gate = GateChip::new();
        let zero = api.ctx().load_zero();
        let one = api.ctx().load_constant(Fr::one());
        let prev_block = gate.sub(api.ctx(), assigned_inputs.claimed_block_number, one);

        let account_prev_block = api.get_account(prev_block, assigned_inputs.addr);
        let prev_nonce = account_prev_block.call(AccountField::Nonce);
        let prev_nonce = api.from_hi_lo(prev_nonce);
        api.ctx().constrain_equal(&prev_nonce, &zero);

        let account = api.get_account(assigned_inputs.claimed_block_number, assigned_inputs.addr);
        let curr_nonce = account.call(AccountField::Nonce);
        let curr_nonce = api.from_hi_lo(curr_nonce);

        api.range.check_less_than(api.ctx(), zero, curr_nonce, 40);

        vec![
            assigned_inputs.addr.into(),
            assigned_inputs.claimed_block_number.into(),
        ]
    }
}

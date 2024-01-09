use std::fmt::Debug;

use axiom_client::{
    axiom_eth::halo2_base::{
        gates::{GateChip, GateInstructions, RangeInstructions},
        AssignedValue,
    },
    subquery::account::AccountField,
};
use axiom_client_derive::AxiomComputeInput;
use ethers::types::Address;

use crate::{
    api::AxiomAPI,
    compute::{AxiomComputeFn, AxiomResult},
    Fr,
};

#[AxiomComputeInput]
pub struct AccountAgeInput {
    pub addr: Address,
    pub claimed_block_number: u64,
}

impl AxiomComputeFn for AccountAgeInput {
    fn compute(
        api: &mut AxiomAPI<Self::Provider>,
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

#[cfg(test)]
mod tests {
    use std::str::FromStr;

    use super::*;
    use crate::axiom_compute_tests;

    fn inputs() -> AccountAgeInput {
        AccountAgeInput {
            addr: Address::from_str("0x897dDbe14c9C7736EbfDC58461355697FbF70048").unwrap(),
            claimed_block_number: 9173677,
        }
    }

    axiom_compute_tests!(AccountAgeInput, inputs, 12);
}

use std::{
    fmt::Debug,
    sync::{Arc, Mutex},
};

use axiom_client::{
    axiom_eth::halo2_base::{
        gates::{GateChip, GateInstructions, RangeChip, RangeInstructions},
        AssignedValue, Context,
    },
    subquery::{account::AccountField, caller::SubqueryCaller},
    utils::from_hi_lo,
};
use axiom_client_derive::AxiomComputeInput;
use ethers::{providers::Http, types::Address};

use crate::{
    compute::{AxiomComputeFn, AxiomResult},
    subquery::account::get_account,
    Fr,
};

#[AxiomComputeInput]
pub struct AccountAgeInput {
    pub addr: Address,
    pub claimed_block_number: u64,
}

impl AxiomComputeFn for AccountAgeInput {
    fn compute(
        ctx: &mut Context<Fr>,
        range: &RangeChip<Fr>,
        caller: Arc<Mutex<SubqueryCaller<Http, Fr>>>,
        assigned_inputs: AccountAgeCircuitInput<AssignedValue<Fr>>,
    ) -> Vec<AxiomResult> {
        let gate = GateChip::new();
        let zero = ctx.load_zero();
        let one = ctx.load_constant(Fr::one());
        let prev_block = gate.sub(ctx, assigned_inputs.claimed_block_number, one);

        let account_prev_block = get_account(ctx, caller.clone(), prev_block, assigned_inputs.addr);
        let prev_nonce = account_prev_block.call(AccountField::Nonce);
        let prev_nonce = from_hi_lo(ctx, range, prev_nonce);
        ctx.constrain_equal(&prev_nonce, &zero);

        let account = get_account(
            ctx,
            caller,
            assigned_inputs.claimed_block_number,
            assigned_inputs.addr,
        );
        let curr_nonce = account.call(AccountField::Nonce);
        let curr_nonce = from_hi_lo(ctx, range, curr_nonce);

        range.check_less_than(ctx, zero, curr_nonce, 40);

        vec![
            assigned_inputs.addr.into(),
            assigned_inputs.claimed_block_number.into(),
        ]
    }
}

#[cfg(test)]
mod tests {
    use std::{env, str::FromStr};

    use axiom_client::axiom_eth::halo2_base::gates::circuit::BaseCircuitParams;
    use ethers::providers::Provider;

    use super::*;
    use crate::compute::AxiomCompute;

    fn provider() -> Provider<Http> {
        Provider::<Http>::try_from(env::var("PROVIDER_URI").expect("PROVIDER_URI not set")).unwrap()
    }

    fn inputs() -> AccountAgeInput {
        AccountAgeInput {
            addr: Address::from_str("0x897dDbe14c9C7736EbfDC58461355697FbF70048").unwrap(),
            claimed_block_number: 9173677,
        }
    }

    #[test]
    fn mock() {
        let params = BaseCircuitParams {
            k: 12,
            num_advice_per_phase: vec![4],
            num_fixed: 1,
            num_lookup_advice_per_phase: vec![1],
            lookup_bits: Some(11),
            num_instance_columns: 1,
        };
        AxiomCompute::<AccountAgeInput>::new()
            .use_inputs(inputs())
            .use_params(params)
            .use_provider(provider())
            .mock();
    }

    #[test]
    fn run() {
        let params = BaseCircuitParams {
            k: 12,
            num_advice_per_phase: vec![4],
            num_fixed: 1,
            num_lookup_advice_per_phase: vec![1],
            lookup_bits: Some(11),
            num_instance_columns: 1,
        };
        let compute = AxiomCompute::<AccountAgeInput>::new()
            .use_params(params)
            .use_provider(provider());
        let (_vk, pk) = compute.keygen();
        compute.use_inputs(inputs()).run(pk);
    }
}

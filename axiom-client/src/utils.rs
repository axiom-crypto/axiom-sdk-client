use std::env;

use axiom_codec::{
    constants::USER_MAX_OUTPUTS,
    types::native::{AxiomV2ComputeQuery, AxiomV2ComputeSnark},
    HiLo,
};
use axiom_query::{
    axiom_eth::{
        halo2_base::{
            gates::{GateInstructions, RangeChip, RangeInstructions},
            utils::{biguint_to_fe, modulus},
            AssignedValue, Context,
            QuantumCell::Constant,
        },
        halo2curves::bn256::G1Affine,
        snark_verifier::pcs::{
            kzg::{KzgAccumulator, LimbsEncoding},
            AccumulatorEncoding,
        },
        snark_verifier_sdk::{NativeLoader, Snark, BITS, LIMBS},
        utils::{keccak::decorator::RlcKeccakCircuitParams, snark_verifier::NUM_FE_ACCUMULATOR},
        Field,
    },
    verify_compute::utils::{
        get_metadata_from_protocol, get_onchain_vk_from_protocol, write_onchain_vkey,
    },
};
use dotenv::dotenv;
use ethers::providers::{Http, Provider};
use itertools::Itertools;
use num_bigint::BigUint;
use num_integer::Integer;
use num_traits::One;

use crate::types::{AxiomCircuitParams, AxiomV2DataAndResults};

pub fn build_axiom_v2_compute_query(
    snark: Snark,
    params: AxiomCircuitParams,
    results: AxiomV2DataAndResults,
) -> AxiomV2ComputeQuery {
    let rlc_keccak_params = RlcKeccakCircuitParams::from(params);
    let rlc_params = rlc_keccak_params.clone().rlc;
    let metadata =
        get_metadata_from_protocol(&snark.protocol, rlc_params, USER_MAX_OUTPUTS).unwrap();
    let k = rlc_keccak_params.k();
    let partial_vk = get_onchain_vk_from_protocol(&snark.protocol, metadata.clone());
    let partial_vk_output = write_onchain_vkey(&partial_vk).unwrap();
    let result_len = results.compute_results.len() as u16;
    let kzg_accumulator = if metadata.is_aggregation {
        let agg_instances = &snark.instances[0];
        let KzgAccumulator { lhs, rhs } =
            <LimbsEncoding<LIMBS, BITS> as AccumulatorEncoding<G1Affine, NativeLoader>>::from_repr(
                &agg_instances[..NUM_FE_ACCUMULATOR].iter().collect_vec(),
            )
            .unwrap();
        Some((lhs, rhs))
    } else {
        None
    };
    let compute_proof = AxiomV2ComputeSnark {
        kzg_accumulator,
        compute_results: results.compute_results.clone(),
        proof_transcript: snark.proof,
    };
    AxiomV2ComputeQuery {
        k: k as u8,
        result_len,
        compute_proof: compute_proof.encode().unwrap().into(),
        vkey: partial_vk_output,
    }
}

pub fn get_provider() -> Provider<Http> {
    dotenv().ok();
    Provider::<Http>::try_from(env::var("PROVIDER_URI").expect("PROVIDER_URI not set")).unwrap()
}

/// Constrains and returns a single CircuitValue from a hi-lo pair
///
/// Constrains (hi < r // 2^128) OR (hi == r // 2^128 AND lo < r % 2^128)
/// * `hi`: the high 128 bits of the CircuitValue
/// * `lo`: the low 128 bits of the CircuitValue
pub fn check_hi_lo<F: Field>(
    ctx: &mut Context<F>,
    range: &RangeChip<F>,
    hi: AssignedValue<F>,
    lo: AssignedValue<F>,
) -> AssignedValue<F> {
    let (hi_max, lo_max) = modulus::<F>().div_mod_floor(&(BigUint::one() << 128));

    //check hi < r // 2**128
    let check_1 = range.is_big_less_than_safe(ctx, hi, hi_max.clone());

    //check (hi == r // 2 ** 128 AND lo < r % 2**128)
    let hi_max_fe = biguint_to_fe::<F>(&hi_max);
    let lo_max_fe = biguint_to_fe::<F>(&lo_max);
    let check_2_hi = range.gate.is_equal(ctx, hi, Constant(hi_max_fe));
    range.range_check(ctx, lo, 128);
    let check_2_lo = range.is_less_than(ctx, lo, Constant(lo_max_fe), 128);
    let check_2 = range.gate.and(ctx, check_2_hi, check_2_lo);

    //constrain (check_1 || check_2) == 1
    let check = range.gate.add(ctx, check_1, check_2);
    range.gate.assert_is_const(ctx, &check, &F::ONE);

    let combined = range
        .gate
        .mul_add(ctx, hi, Constant(range.gate.pow_of_two()[128]), lo);
    combined
}

/// Returns a single CircuitValue from a hi-lo pair
///
/// NOTE: this can fail if the hi-lo pair is greater than the Fr modulus.
/// See `check_hi_lo` for what is constrained.
///
/// * `hi`: the high 128 bits of the CircuitValue
/// * `lo`: the low 128 bits of the CircuitValue
pub fn from_hi_lo<F: Field>(
    ctx: &mut Context<F>,
    range: &RangeChip<F>,
    hilo: HiLo<AssignedValue<F>>,
) -> AssignedValue<F> {
    check_hi_lo(ctx, range, hilo.hi(), hilo.lo())
}

/// Returns a 256-bit hi-lo pair from a single CircuitValue
///
/// See `check_hi_lo` for what is constrained.
///
/// * `a`: the CircuitValue to split into hi-lo
pub fn to_hi_lo<F: Field>(
    ctx: &mut Context<F>,
    range: &RangeChip<F>,
    a: AssignedValue<F>,
) -> HiLo<AssignedValue<F>> {
    let a_val = a.value();
    let a_bytes = a_val.to_bytes_le();

    let mut a_lo_bytes = [0u8; 32];
    let mut a_hi_bytes = [0u8; 32];
    a_lo_bytes[..16].copy_from_slice(&a_bytes[..16]);
    a_hi_bytes[..16].copy_from_slice(&a_bytes[16..]);
    let a_lo = F::from_bytes_le(&a_lo_bytes);
    let a_hi = F::from_bytes_le(&a_hi_bytes);

    let a_lo = ctx.load_witness(a_lo);
    let a_hi = ctx.load_witness(a_hi);

    let a_reconstructed = check_hi_lo(ctx, range, a_hi, a_lo);

    ctx.constrain_equal(&a, &a_reconstructed);

    HiLo::from_hi_lo([a_hi, a_lo])
}

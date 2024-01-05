use axiom_codec::{utils::native::encode_addr_to_field, HiLo};
use axiom_query::axiom_eth::Field;
use ethers::types::{Address, H256};

use super::flatten::FixLenVec;

pub trait RawInput<F: Field> {
    type FEType;
    fn convert(&self) -> Self::FEType;
}

impl<F: Field> RawInput<F> for usize {
    type FEType = F;
    fn convert(&self) -> Self::FEType {
        F::from_u128(*self as u128)
    }
}

impl<F: Field> RawInput<F> for u32 {
    type FEType = F;
    fn convert(&self) -> Self::FEType {
        F::from(*self as u64)
    }
}

impl<F: Field> RawInput<F> for u64 {
    type FEType = F;
    fn convert(&self) -> Self::FEType {
        F::from(*self)
    }
}

impl<F: Field> RawInput<F> for u128 {
    type FEType = F;
    fn convert(&self) -> Self::FEType {
        F::from_u128(*self)
    }
}

impl<F: Field> RawInput<F> for H256 {
    type FEType = HiLo<F>;
    fn convert(&self) -> Self::FEType {
        HiLo::from(*self)
    }
}

impl<F: Field> RawInput<F> for Address {
    type FEType = F;
    fn convert(&self) -> Self::FEType {
        encode_addr_to_field(self)
    }
}

impl<F: Field, const N: usize> RawInput<F> for [u8; N] {
    type FEType = [F; N];
    fn convert(&self) -> Self::FEType {
        let mut res = [F::ZERO; N];
        for i in 0..N {
            res[i] = F::from_u128(self[i] as u128);
        }
        res
    }
}

impl<F: Field, const N: usize> RawInput<F> for FixLenVec<usize, N> {
    type FEType = Vec<F>;
    fn convert(&self) -> Self::FEType {
        let mut res = Vec::new();
        for i in 0..N {
            res.push(F::from_u128(self.vec[i] as u128));
        }
        res
    }
}

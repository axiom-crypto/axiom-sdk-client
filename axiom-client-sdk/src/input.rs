use axiom_client::axiom_eth::utils::hilo::HiLo;
use ethers::types::H256;

pub trait RawInputFEType<T: Copy> {
    type FEType;
}

impl<T: Copy> RawInputFEType<T> for u32 {
    type FEType = T;
}

impl<T: Copy> RawInputFEType<T> for u64 {
    type FEType = T;
}

impl<T: Copy> RawInputFEType<T> for H256 {
    type FEType = HiLo<T>;
}

impl<T: Copy, const N: usize> RawInputFEType<T> for [u8; N] {
    type FEType = [T; N];
}

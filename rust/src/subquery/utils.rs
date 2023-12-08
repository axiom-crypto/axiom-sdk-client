use axiom_eth::{halo2_base::utils::fe_to_biguint, Field};
use ethers::types::{H256, H160};

pub fn usize_to_u8_array(value: usize) -> [u8; 32] {
    let mut arr = [0u8; 32];
    for (i, byte) in arr
        .iter_mut()
        .take(std::mem::size_of::<usize>())
        .enumerate()
    {
        *byte = (value >> (8 * i)) as u8;
    }
    arr
}

pub fn pad_to_bytes32(input: &[u8]) -> [u8; 32] {
    let mut padded = [0u8; 32];
    let len = input.len().min(32);
    padded[..len].copy_from_slice(&input[..len]);
    padded
}

pub fn h256_from_usize(value: usize) -> H256 {
    H256::from(usize_to_u8_array(value))
}

pub fn fe_to_h160<F: Field>(fe: &F) -> H160 {
    let fe_biguint = fe_to_biguint(fe);
    let fe_bytes = fe_biguint.to_bytes_be();
    let mut addr = [0u8; 20];
    addr.copy_from_slice(&fe_bytes[12..]);
    H160::from(&addr)
}

pub fn hi_lo_fe_to_h256<F: Field>(hi: &F, lo: &F) -> H256 {
    let hi_biguint = fe_to_biguint(hi);
    let lo_biguint = fe_to_biguint(lo);
    let mut h256 = [0u8; 32];
    h256[..16].copy_from_slice(&hi_biguint.to_bytes_be());
    h256[16..].copy_from_slice(&lo_biguint.to_bytes_be());
    H256::from(h256)
}
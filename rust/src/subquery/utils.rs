use axiom_codec::types::native::{AnySubquery, SubqueryType};
use axiom_eth::{halo2_base::utils::fe_to_biguint, Field};
use ethers::types::{H160, H256};

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

pub fn get_subquery_type_from_any_subquery(any_subquery: &AnySubquery) -> u64 {
    let subquery_type = match any_subquery {
        AnySubquery::Null => SubqueryType::Null,
        AnySubquery::Header(_) => SubqueryType::Header,
        AnySubquery::Account(_) => SubqueryType::Account,
        AnySubquery::Storage(_) => SubqueryType::Storage,
        AnySubquery::Receipt(_) => SubqueryType::Receipt,
        AnySubquery::Transaction(_) => SubqueryType::Transaction,
        AnySubquery::SolidityNestedMapping(_) => SubqueryType::SolidityNestedMapping,
    };
    subquery_type as u64
}

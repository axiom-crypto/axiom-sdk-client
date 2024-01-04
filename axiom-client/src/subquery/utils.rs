use axiom_codec::types::native::{AnySubquery, SubqueryType};

pub fn pad_to_bytes32(input: &[u8]) -> [u8; 32] {
    let mut padded = [0u8; 32];
    let len = input.len().min(32);
    padded[..len].copy_from_slice(&input[..len]);
    padded
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

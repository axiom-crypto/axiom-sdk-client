#[macro_export]
macro_rules! witness {
    ($builder:expr, $witness_value:expr) => {
        $builder.base.main(0).load_witness($witness_value)
    };
}

#[macro_export]
macro_rules! constant {
    ($builder:expr, $witness_value:expr) => {
        $builder.base.main(0).load_constant($witness_value)
    };
}

#[macro_export]
macro_rules! ctx {
    ($builder:expr, $phase:expr) => {
        $builder.base.main($phase)
    };
}

// consider making a proc macro?
#[macro_export]
macro_rules! impl_fr_from {
    ($enum_type:ty) => {
        use axiom_query::axiom_eth::halo2curves::bn256::Fr;
        impl From<$enum_type> for Fr {
            fn from(field: $enum_type) -> Self {
                Fr::from(field as u64)
            }
        }
    };
}

#![feature(associated_type_defaults)]
#![feature(const_trait_impl)]
#![feature(int_roundings)]
#![feature(custom_test_frameworks)]

pub mod aggregation;
pub mod constants;
pub mod macros;
pub mod run;
pub mod scaffold;
pub mod subquery;
#[cfg(test)]
pub mod test;
#[cfg(test)]
pub mod tests;
pub mod types;
pub mod utils;

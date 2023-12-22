#![feature(associated_type_defaults)]
#![feature(const_trait_impl)]
#![feature(int_roundings)]
#![feature(custom_test_frameworks)]

pub mod constants;
pub mod run;
pub mod scaffold;
pub mod aggregation;
pub mod subquery;
pub mod utils;
pub mod macros;
pub mod types;
#[cfg(test)]
pub mod test;
#[cfg(test)]
pub mod tests;

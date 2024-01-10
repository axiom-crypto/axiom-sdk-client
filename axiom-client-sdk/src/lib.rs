#![allow(incomplete_features)]
#![feature(associated_type_defaults)]
mod api;

pub use axiom_client::{axiom_codec::HiLo, axiom_eth::halo2curves::bn256::Fr};

pub(crate) mod utils;
pub use axiom_client::{self, axiom_eth::halo2_base};
pub use axiom_client_derive::AxiomComputeInput;

pub mod axiom {
    pub use crate::{
        api::AxiomAPI,
        compute::{AxiomCompute, AxiomComputeFn, AxiomResult},
    };
}
pub mod cmd;
pub mod compute;
pub mod subquery;

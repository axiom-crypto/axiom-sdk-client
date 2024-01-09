#![allow(incomplete_features)]
#![feature(associated_type_defaults)]
pub mod compute;
pub mod example;
use std::sync::{Arc, Mutex};

pub use axiom_client::axiom_eth::halo2curves::bn256::Fr;
use ethers::providers::Http;
pub mod subquery;
pub type SubqueryCaller = Arc<Mutex<axiom_client::subquery::caller::SubqueryCaller<Http, Fr>>>;

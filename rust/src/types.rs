use axiom_codec::types::native::AxiomV2ComputeQuery;
use axiom_eth::{Field, rlc::circuit::{RlcConfig, RlcCircuitParams}, halo2_base::gates::circuit::{BaseConfig, BaseCircuitParams}, utils::keccak::decorator::{RlcKeccakConfig, RlcKeccakCircuitParams}};
use ethers::types::H256;
use serde::Serialize;

use crate::subquery::types::RawSubquery;

#[derive(Clone, Debug)]
pub enum AxiomCircuitConfig<F: Field> {
    Rlc(RlcConfig<F>),
    Base(BaseConfig<F>),
    Keccak(RlcKeccakConfig<F>),
}

#[derive(Clone, Debug)]
pub enum AxiomCircuitParams {
    Base(BaseCircuitParams),
    Rlc(RlcCircuitParams),
    Keccak(RlcKeccakCircuitParams),
}

impl Default for AxiomCircuitParams {
    fn default() -> Self {
        Self::Base(BaseCircuitParams::default())
    }
}

#[derive(Debug, Serialize, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct AxiomV2CircuitScaffoldOutput {
    pub(crate) data_query: Vec<RawSubquery>,
    pub(crate) compute_results: Vec<H256>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AxiomV2CircuitOutput {
    pub compute_query: AxiomV2ComputeQuery,
    #[serde(flatten)]
    pub scaffold_output: AxiomV2CircuitScaffoldOutput,
}

impl From<AxiomCircuitParams> for RlcKeccakCircuitParams {
    fn from(value: AxiomCircuitParams) -> Self {
        match value {
            AxiomCircuitParams::Base(params) => RlcKeccakCircuitParams {
                keccak_rows_per_round: 0,
                rlc: RlcCircuitParams {
                    base: params,
                    num_rlc_columns: 0,
                },
            },
            AxiomCircuitParams::Rlc(params) => RlcKeccakCircuitParams {
                keccak_rows_per_round: 0,
                rlc: params,
            },
            AxiomCircuitParams::Keccak(params) => params,
        }
    }
}
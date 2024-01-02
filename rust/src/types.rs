use axiom_codec::types::native::AxiomV2ComputeQuery;
use axiom_query::axiom_eth::{
    halo2_base::gates::circuit::{BaseCircuitParams, BaseConfig},
    rlc::circuit::{RlcCircuitParams, RlcConfig},
    snark_verifier_sdk::Snark,
    utils::keccak::decorator::{RlcKeccakCircuitParams, RlcKeccakConfig},
    Field,
};
use ethers::types::H256;
use serde::Serialize;

use crate::subquery::types::Subquery;

#[derive(Clone, Debug)]
pub enum AxiomCircuitConfig<F: Field> {
    Base(BaseConfig<F>),
    Rlc(RlcConfig<F>),
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
pub struct AxiomV2DataAndResults {
    pub(crate) data_query: Vec<Subquery>,
    pub(crate) compute_results: Vec<H256>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct AxiomV2CircuitOutput {
    pub compute_query: AxiomV2ComputeQuery,
    #[serde(flatten)]
    pub data: AxiomV2DataAndResults,
    #[serde(skip_serializing)]
    pub snark: Snark,
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

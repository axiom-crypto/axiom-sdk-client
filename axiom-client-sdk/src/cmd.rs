use std::{env, fmt::Debug, fs, path::PathBuf};

use axiom_client::axiom_eth::halo2_base::{gates::circuit::BaseCircuitParams, AssignedValue};
pub use clap::Parser;
use clap::Subcommand;
use ethers::providers::{Http, Provider};

use crate::{
    compute::{AxiomCompute, AxiomComputeFn},
    Fr,
};

#[derive(Clone, Copy, Debug, Subcommand)]
pub enum SnarkCmd {
    /// Run the mock prover
    Mock,
    /// Generate new proving & verifying keys
    Keygen,
    /// Generate a new proof
    Prove,
    /// Generate an Axiom compute query
    Run,
}

impl std::fmt::Display for SnarkCmd {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Mock => write!(f, "mock"),
            Self::Keygen => write!(f, "keygen"),
            Self::Prove => write!(f, "prove"),
            Self::Run => write!(f, "run"),
        }
    }
}

#[derive(Parser, Debug)]
#[command(author, version, about, long_about = None)]
/// Command-line helper for building Axiom compute circuits
pub struct Cli {
    #[command(subcommand)]
    pub command: SnarkCmd,
    #[arg(short = 'k', long = "degree")]
    pub degree: u32,
    #[arg(short = 'p', long = "provider")]
    pub provider: Option<String>,
    #[arg(short, long = "input")]
    pub input_path: Option<PathBuf>,
}

pub fn run_cli<A: AxiomComputeFn>()
where
    A::Input<Fr>: Default + Debug,
    A::Input<AssignedValue<Fr>>: Debug,
{
    let cli = Cli::parse();
    match cli.command {
        SnarkCmd::Mock | SnarkCmd::Prove | SnarkCmd::Run => {
            if cli.input_path.is_none() {
                panic!("The `input_path` argument is required for the selected command.");
            }
        }
        _ => {}
    }
    let input_path = cli.input_path.unwrap();
    let json_str = fs::read_to_string(input_path).expect("Unable to read file");
    let input: A::LogicInput = serde_json::from_str(&json_str).expect("Unable to parse JSON");
    if cli.provider.is_none() && env::var("PROVIDER_URI").is_err() {
        panic!("The `provider` argument is required for the selected command. Either pass it as an argument or set the `PROVIDER_URI` environment variable.");
    }
    let provider_uri = cli
        .provider
        .unwrap_or_else(|| env::var("PROVIDER_URI").unwrap());
    let provider = Provider::<Http>::try_from(provider_uri).unwrap();

    let params = BaseCircuitParams {
        k: 12,
        num_advice_per_phase: vec![4],
        num_fixed: 1,
        num_lookup_advice_per_phase: vec![1],
        lookup_bits: Some(11),
        num_instance_columns: 1,
    };
    match cli.command {
        SnarkCmd::Mock => {
            AxiomCompute::<A>::new()
                .use_inputs(input)
                .use_params(params)
                .use_provider(provider)
                .mock();
        }
        SnarkCmd::Keygen => {
            AxiomCompute::<A>::new()
                .use_params(params)
                .use_provider(provider)
                .keygen();
        }
        SnarkCmd::Prove => {
            let compute = AxiomCompute::<A>::new()
                .use_params(params)
                .use_provider(provider);
            let (_vk, pk) = compute.keygen();
            compute.use_inputs(input).prove(pk);
        }
        SnarkCmd::Run => {
            let compute = AxiomCompute::<A>::new()
                .use_params(params)
                .use_provider(provider);
            let (_vk, pk) = compute.keygen();
            compute.use_inputs(input).run(pk);
        }
    }
}

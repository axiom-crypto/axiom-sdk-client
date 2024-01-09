use std::env;

use ethers::providers::{Http, Provider};

pub fn provider() -> Provider<Http> {
    Provider::<Http>::try_from(env::var("PROVIDER_URI").expect("PROVIDER_URI not set")).unwrap()
}

#[macro_export]
macro_rules! axiom_compute_tests {
    ($input_struct:ident, $inputs:ident, $k: expr) => {
        fn params() -> axiom_client::axiom_eth::halo2_base::gates::circuit::BaseCircuitParams {
            axiom_client::axiom_eth::halo2_base::gates::circuit::BaseCircuitParams {
                k: $k,
                num_advice_per_phase: vec![4],
                num_fixed: 1,
                num_lookup_advice_per_phase: vec![1],
                lookup_bits: Some($k - 1),
                num_instance_columns: 1,
            }
        }

        #[test]
        fn mock() {
            $crate::compute::AxiomCompute::<$input_struct>::new()
                .use_inputs($inputs())
                .use_params(params())
                .use_provider($crate::utils::provider())
                .mock();
        }

        #[test]
        fn keygen() {
            $crate::compute::AxiomCompute::<$input_struct>::new()
                .use_inputs($inputs())
                .use_params(params())
                .use_provider($crate::utils::provider())
                .keygen();
        }

        #[test]
        fn prove() {
            let compute = $crate::compute::AxiomCompute::<$input_struct>::new()
                .use_inputs($inputs())
                .use_params(params())
                .use_provider($crate::utils::provider());
            let (_vk, pk) = compute.keygen();
            compute.prove(pk);
        }

        #[test]
        fn run() {
            let compute = $crate::compute::AxiomCompute::<$input_struct>::new()
                .use_inputs($inputs())
                .use_params(params())
                .use_provider($crate::utils::provider());
            let (_vk, pk) = compute.keygen();
            compute.run(pk);
        }
    };
}

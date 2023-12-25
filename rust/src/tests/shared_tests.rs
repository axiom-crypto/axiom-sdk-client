use axiom_codec::types::field_elements::{FieldSubqueryResult, SUBQUERY_RESULT_LEN};
use axiom_eth::halo2curves::bn256::Fr;
use ethers::providers::Http;

use crate::{
    run::inner::mock,
    scaffold::{AxiomCircuit, AxiomCircuitScaffold},
    types::AxiomCircuitParams,
    utils::get_provider,
};

pub fn mock_test<S: AxiomCircuitScaffold<Http, Fr>>(params: AxiomCircuitParams, _circuit: S) {
    let client = get_provider();
    mock::<_, S>(client, params, None);
}

pub fn single_instance_test<S: AxiomCircuitScaffold<Http, Fr>>(
    params: AxiomCircuitParams,
    _circuit: S,
) {
    let client = get_provider();
    let runner = AxiomCircuit::<_, _, S>::new(client, params);
    let instances = runner.instances();
    //check that there's only one instance column
    assert_eq!(instances.len(), 1);
    let instances = instances.get(0).unwrap();
    let num_user_output_fe = runner.output_num_instances();
    let num_subquery_fe = runner.subquery_num_instances();
    //check that number of instances is equal to number of user output field elements + number of subquery field elements
    assert_eq!(instances.len(), num_user_output_fe + num_subquery_fe);
    //check that user output field elements are all zero (as we don't add any in these tests)
    assert_eq!(
        &instances[0..num_user_output_fe],
        &vec![Fr::from(0); num_user_output_fe]
    );
    let results = runner.scaffold_output();
    //check that there's only one subquery
    assert_eq!(results.data_query.len(), 1);
    let subquery = FieldSubqueryResult::<Fr>::from(results.data_query.get(0).unwrap().clone());
    //check the instances that correspond to single data subquery
    assert_eq!(
        subquery.to_fixed_array(),
        &instances[num_user_output_fe..num_user_output_fe + SUBQUERY_RESULT_LEN]
    );
    //check that remaining instances are zero
    assert_eq!(
        &instances[num_user_output_fe + SUBQUERY_RESULT_LEN..],
        &vec![Fr::from(0); num_subquery_fe - SUBQUERY_RESULT_LEN]
    );
}

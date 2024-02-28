import { AxiomV2CircuitConstant } from "@axiom-crypto/tools";

export const USER_OUTPUT_FE = AxiomV2CircuitConstant.UserResultFieldElements;
export const MAX_USER_OUTPUTS = AxiomV2CircuitConstant.UserMaxOutputs;
export const MAX_DATA_SUBQUERIES = AxiomV2CircuitConstant.UserMaxSubqueries;
export const MAX_SUBQUERY_INPUTS = AxiomV2CircuitConstant.MaxSubqueryInputs;
export const MAX_SUBQUERY_OUTPUTS = AxiomV2CircuitConstant.MaxSubqueryOutputs;
export const SUBQUERY_FE = (1 + MAX_SUBQUERY_INPUTS + MAX_SUBQUERY_OUTPUTS);

export const MAX_SOLIDITY_MAPPING_KEYS = AxiomV2CircuitConstant.MaxSolidityMappingKeys;

export const USER_COMPUTE_NUM_INSTANCES = MAX_USER_OUTPUTS * USER_OUTPUT_FE;
export const SUBQUERY_NUM_INSTANCES = MAX_DATA_SUBQUERIES * SUBQUERY_FE;

export const COMPUTE_NUM_INSTANCES = USER_COMPUTE_NUM_INSTANCES + SUBQUERY_NUM_INSTANCES;

export const DEFAULT_CIRCUIT_CONFIG = {
    k: 14,
    numAdvice: AxiomV2CircuitConstant.UserAdviceCols,
    numLookupAdvice: AxiomV2CircuitConstant.UserLookupAdviceCols,
    numInstance: AxiomV2CircuitConstant.UserInstanceCols,
    numLookupBits: 13,
    numVirtualInstance: 2,
};

export const DEFAULT_CAPACITY = {
    maxOutputs: AxiomV2CircuitConstant.UserMaxOutputs,
    maxSubqueries: AxiomV2CircuitConstant.UserMaxSubqueries,
}
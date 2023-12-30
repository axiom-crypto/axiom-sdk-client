import { encodeAxiomV2CircuitMetadata } from "../../src/encoder";
import { AxiomV2CircuitConstant } from "@axiom-crypto/tools";
import { AxiomV2CircuitMetadataParams } from "../../src/types";

describe("Encoder", () => {
  test("Encode AxiomV2CircuitMetadata", () => {
    const SUBQUERY_RESULT_LEN = 1 + AxiomV2CircuitConstant.MaxSubqueryInputs + AxiomV2CircuitConstant.MaxSubqueryOutputs;
    const DEFAULT_METADATA: AxiomV2CircuitMetadataParams = {
      version: 0,
      numAdvicePerPhase: [AxiomV2CircuitConstant.UserAdviceCols],
      numLookupAdvicePerPhase: [AxiomV2CircuitConstant.UserLookupAdviceCols],
      numRlcColumns: 0,
      numFixed: AxiomV2CircuitConstant.UserFixedCols,
      numValuesPerInstanceColumn: [
        AxiomV2CircuitConstant.UserMaxOutputs * AxiomV2CircuitConstant.UserResultFieldElements + 
        AxiomV2CircuitConstant.UserMaxSubqueries * SUBQUERY_RESULT_LEN
      ],
      numChallenge: [0],
      maxOutputs: AxiomV2CircuitConstant.UserMaxOutputs,
      isAggregation: false,
    }
    const encoded = encodeAxiomV2CircuitMetadata(DEFAULT_METADATA);
    const expected = "0x0001000009000100000004010000010080000000000000000000000000000000";
    expect(encoded).toEqual(expected);
  });
});
import { encodeAxiomV2CircuitMetadata } from "../../src/encoder";

describe("Encoder", () => {
  test("Encode AxiomV2CircuitMetadata", () => {
    const DEFAULT_METADATA = {
      version: 0,
      numAdvicePerPhase: [4],
      numLookupAdvicePerPhase: [1],
      numRlcColumns: 0,
      numFixed: 1,
      numInstance: [128*2 + 128*16],
      numChallenge: [0],
      maxOutputs: 128,
      isAggregation: false,
    }
    const encoded = encodeAxiomV2CircuitMetadata(DEFAULT_METADATA);
    const expected = "0x0001000009000100000004010000010080000000000000000000000000000000";
    expect(encoded).toEqual(expected);
  });
});
import { convertInputSchemaToJsonString } from "../../../src/axiom/utils";

describe("Input schema tests", () => {
  test("validate input schema transform", async () => {
    let inputSchema = convertInputSchemaToJsonString({
      claimedBlockNumber: "uint32",
      abort: "bytes32",
      argo: "int224[]",
      test: "uint256[]",
    });
    let expectedOutput = '{\n  "claimedBlockNumber": "CircuitValue",\n  "abort": "CircuitValue256",\n  "argo": "CircuitValue[]",\n  "test": "CircuitValue256[]"\n}';
    expect(inputSchema).toEqual(expectedOutput);

    inputSchema = convertInputSchemaToJsonString({
      blockNumber: "uint32",
      address: "address",
    });
    expectedOutput = '{\n  "blockNumber": "CircuitValue",\n  "address": "CircuitValue"\n}';
    expect(inputSchema).toEqual(expectedOutput);
  });
});
import { AbiType } from "../../../src/types";
import { getAxiomV2Abi } from "../../../src/lib/abi";
import AxiomV2QueryAbi from "../../../src/lib/abi/AxiomV2Query.json";

describe("ABI library unit tests", () => {
  test("Get AxiomV2Query ABI", () => {
    const abi = getAxiomV2Abi(AbiType.Query);
    expect(abi).toEqual(AxiomV2QueryAbi.abi);
  })
});
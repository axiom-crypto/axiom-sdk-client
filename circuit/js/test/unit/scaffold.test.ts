import { concat, zeroHash } from "viem";
import { AxiomBaseCircuit } from "../../src/js";
import { circuit } from "./circuits/7_balance.circuit";

describe("Scaffold", () => {
  test("Build computeQuery", async () => {
    const testCircuit = new AxiomBaseCircuit({
      provider: process.env.PROVIDER_URI_GOERLI as string,
      f: circuit,
      inputSchema: `{
        "address": "CircuitValue",
        "claimedBlockNumber": "CircuitValue"
      }`,
      chainId: 5,
      mock: true,
    });
    const defaultInputs = {
      address: "0x897dDbe14c9C7736EbfDC58461355697FbF70048",
      claimedBlockNumber: 9173677,
    };
    const _artifact = await testCircuit.compile(defaultInputs);
    const computeQuery = await testCircuit.run(defaultInputs);
    expect(computeQuery.vkey[0]).toEqual("0x0001000000010100000004010000010080000000000000000000000000000000");
    expect(computeQuery.computeProof.slice(2).slice(0,128)).toEqual(concat([zeroHash, zeroHash]).slice(2));
  }, 30000);
});
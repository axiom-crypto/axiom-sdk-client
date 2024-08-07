import { concat, zeroHash } from "viem";
import { AxiomBaseCircuit } from "../../../src/js";
import { circuit as seven_balance_circuit } from "../circuits/7_balance.circuit";

describe("Scaffold", () => {
  test("Build computeQuery", async () => {
    // This circuit gets a single account's balance 7 times and adds them to the results
    const testCircuit = new AxiomBaseCircuit({
      rpcUrl: process.env.RPC_URL_11155111 as string,
      f: seven_balance_circuit,
      chainId: 5,
      mock: true,
    });
    const defaultInputs = {
      address: "0x897dDbe14c9C7736EbfDC58461355697FbF70048",
      claimedBlockNumber: 5000000,
    };
    const _artifact = await testCircuit.compile(defaultInputs);
    const computeQuery = await testCircuit.run(defaultInputs);
    const querySchema = testCircuit.getQuerySchema();

    expect(querySchema).toEqual("0x21320f4358ce83ec05dcbe1be8cc43002f6ab194fb3d014f9046022aa2bd1784");
    expect(computeQuery.vkey[0]).toEqual("0x0001000009000100000004010000010080000000000000000000000000000000");
    expect(computeQuery.computeProof.slice(2).slice(0, 128)).toEqual(concat([zeroHash, zeroHash]).slice(2));
  }, 30000);
});
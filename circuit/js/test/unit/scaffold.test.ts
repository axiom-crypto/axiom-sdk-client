import { concat, zeroHash } from "viem";
import { AxiomBaseCircuit } from "../../src/js";
import { circuit as seven_balance_circuit } from "./circuits/7_balance.circuit";

describe("Scaffold", () => {
  test("Build computeQuery", async () => {
    // This circuit gets a single account's balance 7 times and adds them to the results
    const testCircuit = new AxiomBaseCircuit({
      provider: process.env.PROVIDER_URI_SEPOLIA as string,
      f: seven_balance_circuit,
      inputSchema: `{
        "address": "CircuitValue",
        "claimedBlockNumber": "CircuitValue"
      }`,
      chainId: 5,
      mock: true,
    });

    const defaultInputs = {
      address: "0xB392448932F6ef430555631f765Df0dfaE34efF3",
      claimedBlockNumber: 4017000,
    };

    const _artifact = await testCircuit.compile(defaultInputs);
    const computeQuery = await testCircuit.run(defaultInputs);
    const querySchema = testCircuit.getQuerySchema();

    expect(querySchema).toEqual(
      "0x21320f4358ce83ec05dcbe1be8cc43002f6ab194fb3d014f9046022aa2bd1784",
    );
    expect(computeQuery.vkey[0]).toEqual(
      "0x0001000009000100000004010000010080000000000000000000000000000000",
    );
    expect(computeQuery.computeProof.slice(2).slice(0, 128)).toEqual(
      concat([zeroHash, zeroHash]).slice(2),
    );
  }, 30000);
});

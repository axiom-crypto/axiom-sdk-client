import { Axiom } from "../../src";
import { bytes32 } from "@axiom-crypto/circuit/pkg/tools";
import { generateCircuit } from "./circuitTest";

describe("QueryID Integration Tests", () => {
  test("check queryId matches emitted event", async () => {
    const { circuit, compiledCircuit, inputs } = await generateCircuit("queryId/basic");

    const axiom = new Axiom({
      circuit,
      compiledCircuit,
      chainId: "11155111",  // Sepolia
      provider: process.env.PROVIDER_URI_SEPOLIA as string,
      privateKey: process.env.PRIVATE_KEY_SEPOLIA as string,
      callback: {
        target: "0x4A4e2D8f3fBb3525aD61db7Fc843c9bf097c362e",
      },
    });
    await axiom.init();
    await axiom.prove(inputs);
    const args = axiom.getSendQueryArgs();
    if (!args) {
      throw new Error("Unable to get sendQuery args.");
    }
    const receipt = await axiom.sendQuery();
    expect(receipt.status).toBe('success');

    const queryInitiatedOnChainEvent = receipt.logs[1];
    const onchainQueryId = queryInitiatedOnChainEvent.topics[3];
    expect(bytes32(args.queryId)).toEqual(onchainQueryId);
  }, 90000);
});

import { Axiom } from "../../src";
import { bytes32 } from "@axiom-crypto/core";
import { generateCircuit, getTarget, parseArgs, runTestPass } from "./circuitTest";

const { chainId } = parseArgs();

describe("QueryID Integration Tests", () => {
  test("check queryId matches emitted event", async () => {
    const { circuit, compiledCircuit, inputs } = await generateCircuit(chainId, "queryId/basic");

    const axiom = new Axiom({
      circuit,
      compiledCircuit,
      chainId,
      provider: process.env[`PROVIDER_URI_${chainId}`] as string,
      privateKey: process.env[`PRIVATE_KEY_${chainId}`] as string,
      callback: {
        target: getTarget(chainId),
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

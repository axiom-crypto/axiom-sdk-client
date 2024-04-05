import { Axiom } from "../../src";
import { generateCircuit, getTarget, parseArgs } from "./circuitTest";

const { chainId } = parseArgs();

describe("EIP-4844 transaction", () => {
  test("Send EIP-4848 transaction", async () => {
    if (!(chainId === "1" || chainId === "11155111")) {
      return;
    }
    const { circuit, compiledCircuit, inputs } = await generateCircuit(chainId, "eip4844/eip4844receipt");

    const testFn = async () => {
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
      const receipt = await axiom.sendQuery();
    };
    await expect(testFn()).rejects.toThrow();
  }, 60000);
})
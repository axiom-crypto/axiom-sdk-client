import { Axiom } from "../../src";
import { generateCircuit, getTarget, parseArgs } from "./circuitTest";

const CHAIN_ID = process.env.CHAIN_ID as string;

describe("EIP-4844 transaction", () => {
  test("Send EIP-4848 transaction", async () => {
    if (!(CHAIN_ID === "1" || CHAIN_ID === "11155111")) {
      return;
    }
    const { circuit, compiledCircuit, inputs } = await generateCircuit(CHAIN_ID, "eip4844/eip4844receipt");

    const testFn = async () => {
      const axiom = new Axiom({
        circuit,
        compiledCircuit,
        chainId: CHAIN_ID,
        provider: process.env[`PROVIDER_URI_${CHAIN_ID}`] as string,
        privateKey: process.env[`PRIVATE_KEY_${CHAIN_ID}`] as string,
        callback: {
          target: getTarget(CHAIN_ID),
        },
      });
      await axiom.init();
      await axiom.prove(inputs);
      const receipt = await axiom.sendQuery();
    };
    await expect(testFn()).rejects.toThrow();
  }, 60000);
})
import { Axiom } from "../../src";
import { generateCircuit } from "./circuitTest";

describe("Send Query using Axiom client", () => {
  test("Send a query", async () => {
    const { circuit, compiledCircuit, inputs } = await generateCircuit("sendQuery/average");

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
    if (!process.env.PRIVATE_KEY_SEPOLIA) {
      console.log("No private key provided: Query will not be sent to the blockchain.");
      return;
    }
    const receipt = await axiom.sendQuery();
    expect(receipt.status).toBe('success');
  }, 60000);
});
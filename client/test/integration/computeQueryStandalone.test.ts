import { Axiom } from "../../src";
import { generateCircuit } from "./circuitTest";

describe("Build ComputeQuery Standalone", () => {
  test("simple computeQuery w/ no data subqueries", async () => {
    const { circuit, compiledCircuit, inputs } = await generateCircuit("computeQueryStandalone/computeQueryNoData");

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
    const receipt = await axiom.sendQuery();
    expect(receipt.status).toBe('success');
  }, 60000);

  test("larger computeQuery w/ no data subqueries", async () => {
    const { circuit, compiledCircuit, inputs } = await generateCircuit("computeQueryStandalone/computeQueryNoDataLarge");

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
    const receipt = await axiom.sendQuery();
    expect(receipt.status).toBe('success');
  }, 60000);
});

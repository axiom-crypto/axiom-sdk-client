import { Axiom } from "../../src";
import { generateCircuit } from "./circuitTest";

describe("On-chain Data Query scenarios", () => {
  test("Send one of each DataQuery", async () => {
    const { circuit, compiledCircuit, inputs } = await generateCircuit("capacityDataQuery/oneOfEach");

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
  }, 90000);

  test("Send a size-128 header DataQuery", async () => {
    const { circuit, compiledCircuit, inputs } = await generateCircuit("capacityDataQuery/size128Header");
    
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
  }, 180000);

  test("256-capacity query", async () => {
    const { circuit, compiledCircuit, inputs } = await generateCircuit("capacityDataQuery/size256Header");

    const axiom = new Axiom({
      circuit: circuit,
      compiledCircuit: compiledCircuit,
      chainId: "11155111",  // Sepolia
      provider: process.env.PROVIDER_URI_SEPOLIA as string,
      privateKey: process.env.PRIVATE_KEY_SEPOLIA as string,
      callback: {
        target: "0x4A4e2D8f3fBb3525aD61db7Fc843c9bf097c362e",
      },
      options: {
        overrides: {
          validateBuild: false,
        },
      },
      capacity: {
        maxOutputs: 256,
        maxSubqueries: 256,
      },
    });
    await axiom.init();
    await axiom.prove(inputs);
    const receipt = await axiom.sendQuery();
    // Transaction will be sent successfully but fulfill tx may not succeed
    expect(receipt.status).toBe('success');
  }, 180000);
});

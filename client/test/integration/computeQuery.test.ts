
import { Axiom } from "../../src";
import { generateCircuit } from "./circuitTest";

describe("Build ComputeQuery with DataQuery", () => {
  test("simple computeQuery with dataQuery", async () => {
    const { circuit, compiledCircuit, inputs } = await generateCircuit("computeQuery/simple");

    const axiom = new Axiom({
      circuit: circuit,
      compiledCircuit: compiledCircuit,
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

  test("simple computeQuery with dataQuery and address override", async () => {
    const { circuit, compiledCircuit, inputs } = await generateCircuit("computeQuery/simple");
    
    const chainIdOverride = "84532";
    const addressOverride = "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";

    const axiom = new Axiom({
      circuit: circuit,
      compiledCircuit: compiledCircuit,
      chainId: chainIdOverride,  // Base
      provider: process.env.PROVIDER_URI_84532 as string,
      privateKey: process.env.PRIVATE_KEY_SEPOLIA as string,
      callback: {
        target: "0x4A4e2D8f3fBb3525aD61db7Fc843c9bf097c362e",
      },
      options: {
        overrides: {
          queryAddress: addressOverride,
        }
      }
    });
    await axiom.init();
    await axiom.prove(inputs);
    const args = axiom.getSendQueryArgs();
    if (!args) {
      throw new Error("Unable to get sendQuery args.");
    }
    expect(args.args[0]).toBe(chainIdOverride);
    expect(args.address).toBe(addressOverride);
  }, 90000);

  test("simple computeQuery with non-default capacity", async () => {
    const { circuit, compiledCircuit, inputs } = await generateCircuit("computeQuery/simpleWithCapacity");

    const axiom = new Axiom({
      circuit: circuit,
      compiledCircuit: compiledCircuit,
      chainId: "11155111",  // Sepolia
      provider: process.env.PROVIDER_URI_SEPOLIA as string,
      privateKey: process.env.PRIVATE_KEY_SEPOLIA as string,
      callback: {
        target: "0x4A4e2D8f3fBb3525aD61db7Fc843c9bf097c362e",
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
  }, 90000);
});

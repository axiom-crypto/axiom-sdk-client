import { Axiom } from "../../src";
import { circuit as circuit0 } from "./circuits/computeQuery/simple.circuit";
import compiledCircuit0 from "./circuits/computeQuery/simple.compiled.json";
import inputs0 from "./circuits/computeQuery/simple.inputs.json";

describe("Build ComputeQuery with DataQuery", () => {
  test("simple computeQuery with dataQuery", async () => {
    const axiom = new Axiom({
      circuit: circuit0,
      compiledCircuit: compiledCircuit0,
      chainId: "11155111",  // Sepolia
      provider: process.env.PROVIDER_URI_SEPOLIA as string,
      privateKey: process.env.PRIVATE_KEY_SEPOLIA as string,
      callback: {
        target: "0x4A4e2D8f3fBb3525aD61db7Fc843c9bf097c362e",
      },
    });
    await axiom.init();
    const args = await axiom.prove(inputs0);
    const receipt = await axiom.sendQuery(args);
    expect(receipt.status).toBe('success');
  }, 60000);
});

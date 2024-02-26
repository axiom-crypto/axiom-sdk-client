import { circuit as circuit0 } from "../circuits/computeQueryNoData.circuit";
import compiledCircuit0 from "../circuits/computeQueryNoData.compiled.json";
import { circuit as circuit1 } from "../circuits/computeQueryNoData.circuit";
import compiledCircuit1 from "../circuits/computeQueryNoData.compiled.json";
import { Axiom } from "../../src";

describe("Build ComputeQuery Standalone", () => {
  test("simple computeQuery w/ no data subqueries", async () => {
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
    const args = await axiom.prove({});
    const receipt = await axiom.sendQuery(args);
    expect(receipt.status).toBe('success');
  }, 60000);

  test("larger computeQuery w/ no data subqueries", async () => {
    const axiom = new Axiom({
      circuit: circuit1,
      compiledCircuit: compiledCircuit1,
      chainId: "11155111",  // Sepolia
      provider: process.env.PROVIDER_URI_SEPOLIA as string,
      privateKey: process.env.PRIVATE_KEY_SEPOLIA as string,
      callback: {
        target: "0x4A4e2D8f3fBb3525aD61db7Fc843c9bf097c362e",
      },
    });
    await axiom.init();
    const args = await axiom.prove({});
    const receipt = await axiom.sendQuery(args);
    expect(receipt.status).toBe('success');
  }, 60000);
});

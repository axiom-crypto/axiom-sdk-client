import { circuit as circuit0 } from "./circuits/capacityDataQuery/oneOfEach.circuit";
import compiledCircuit0 from "./circuits/capacityDataQuery/oneOfEach.compiled.json";
import { circuit as circuit1 } from "./circuits/capacityDataQuery/size128Header.circuit";
import compiledCircuit1 from "./circuits/capacityDataQuery/size128Header.compiled.json";
import { Axiom } from "../../src";

describe("On-chain Data Query scenarios", () => {
  test("Send one of each DataQuery", async () => {
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

  test("Send a size-128 header DataQuery", async () => {
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

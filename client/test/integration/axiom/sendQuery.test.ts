import { circuit, CircuitInputs } from "../circuit/average.circuit";
import { Axiom } from "../../../src/";
import inputs from '../circuit/average.inputs.json';
import compiledCircuit from '../circuit/average.compiled.json';
import { RawInput } from "@axiom-crypto/circuit/types";

describe("Send Query using Axiom client", () => {
  test("Send a query", async () => {
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
    const args = await axiom.prove(inputs as RawInput<CircuitInputs>);
    if (!process.env.PRIVATE_KEY_SEPOLIA) {
      console.log("No private key provided: Query will not be sent to the blockchain.");
      return;
    }
    const receipt = await axiom.sendQuery();
    expect(receipt.status).toBe('success');
  }, 60000);
});
import { Axiom } from "../../../src/axiom";
import { circuit } from '../circuits/average.circuit'
import compiledCircuit from '../circuits/average.compiled.json';

describe("Axiom tests", () => {
  test("Prove a circuit", async () => {
    const axiom = new Axiom({
      circuit: circuit,
      compiledCircuit: compiledCircuit,
      inputSchema: {
        blockNumber: "uint32",
        address: "address",
      },
      chainId: "11155111",  // Sepolia
      provider: process.env.PROVIDER_URI_SEPOLIA as string,
      privateKey: process.env.PRIVATE_KEY_SEPOLIA as string,
      mock: true,
      callback: {
        target: "0x4A4e2D8f3fBb3525aD61db7Fc843c9bf097c362e",
      },
    });
    await axiom.init();
    const args = await axiom.prove({
      blockNumber: 4000000,
      address: "0xEaa455e4291742eC362Bc21a8C46E5F2b5ed4701",
    });
    console.log(args);
  });
});
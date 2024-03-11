import { Axiom } from "../../../src";
import { createPublicClient, http } from "viem";
import { viemChain } from "../../../src/lib/viem";
import { circuit } from "../../integration/circuits/quickstart/average.circuit";
import compiledCircuit from "../circuits/average.compiled.json";
import inputs from "../../integration/circuits/quickstart/average.inputs.json";

describe("PaymentCalc", () => {
  const CHAIN_ID = "11155111";
  const publicClient = createPublicClient({
    chain: viemChain(CHAIN_ID, process.env.PROVIDER_URI_SEPOLIA as string),
    transport: http(process.env.PROVIDER_URI_SEPOLIA as string),
  });

  test("Payment calculation default based on options", async () => {
    const axiom = new Axiom({
      circuit,
      compiledCircuit,
      chainId: CHAIN_ID,
      provider: process.env.PROVIDER_URI_SEPOLIA as string,
      privateKey: process.env.PRIVATE_KEY_SEPOLIA as string,
      callback: {
        target: "0x4A4e2D8f3fBb3525aD61db7Fc843c9bf097c362e",
      },
      options: {
        maxFeePerGas: "5000000000",
      },
    });
    await axiom.init();
    await axiom.prove(inputs);
    const args = axiom.getSendQueryArgs();
    expect(args?.value).toEqual(5600000000000000n);
  }, 20000);

  test("Payment calculation high based on options", async () => {
    const axiom = new Axiom({
      circuit,
      compiledCircuit,
      chainId: CHAIN_ID,
      provider: process.env.PROVIDER_URI_SEPOLIA as string,
      privateKey: process.env.PRIVATE_KEY_SEPOLIA as string,
      callback: {
        target: "0x4A4e2D8f3fBb3525aD61db7Fc843c9bf097c362e",
      },
      options: {
        maxFeePerGas: "500000000000",
        callbackGasLimit: 1000000000,
      },
    });
    await axiom.init();
    await axiom.prove(inputs);
    const args = axiom.getSendQueryArgs();
    expect(args?.value).toEqual(500213000000000000000n);
  }, 20000);

  test("Payment calculation high based on options", async () => {
    const axiom = new Axiom({
      circuit,
      compiledCircuit,
      chainId: CHAIN_ID,
      provider: process.env.PROVIDER_URI_SEPOLIA as string,
      privateKey: process.env.PRIVATE_KEY_SEPOLIA as string,
      callback: {
        target: "0x4A4e2D8f3fBb3525aD61db7Fc843c9bf097c362e",
      },
      options: {
        maxFeePerGas: "5000000000",
        callbackGasLimit: 1000,
      },
    });
    await axiom.init();
    await axiom.prove(inputs);
    const args = axiom.getSendQueryArgs();
    expect(args?.value).toEqual(5105000000000000n);
  }, 20000);
});
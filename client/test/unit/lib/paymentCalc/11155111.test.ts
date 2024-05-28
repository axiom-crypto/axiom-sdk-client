import { Axiom } from "../../../../src";
import { circuit } from "../../../circuits/quickstart/average.circuit";
import compiledCircuit from "../../../circuits/quickstart/average.compiled.json";
import inputs from "../../../circuits/quickstart/11155111/average.inputs.json";

describe("PaymentCalc: Ethereum", () => {
  const CHAIN_ID = "11155111";

  const config = {
    circuit,
    compiledCircuit,
    chainId: CHAIN_ID,
    rpcUrl: process.env.RPC_URL_11155111 as string,
    privateKey: process.env.PRIVATE_KEY_ANVIL as string,
    callback: {
      target: "0x4A4e2D8f3fBb3525aD61db7Fc843c9bf097c362e",
    },
  }

  test("Payment calculation default based on options", async () => {
    const axiom = new Axiom({
      ...config,
      options: {
        maxFeePerGas: "5000000000",
      },
    });
    await axiom.init();
    await axiom.prove(inputs);
    const args = axiom.getSendQueryArgs();
    expect(args?.value).toEqual(5600000000000000n);
  }, 30000);

  test("Payment calculation high based on options", async () => {
    const axiom = new Axiom({
      ...config,
      options: {
        maxFeePerGas: "500000000000",
        callbackGasLimit: 1000000000,
      },
    });
    await axiom.init();
    await axiom.prove(inputs);
    const args = axiom.getSendQueryArgs();
    expect(args?.value).toEqual(500213000000000000000n);
  }, 30000);

  test("Payment calculation low based on options", async () => {
    const axiom = new Axiom({
      ...config,
      options: {
        maxFeePerGas: "5000000000",
        callbackGasLimit: 1000,
      },
    });
    await axiom.init();
    await axiom.prove(inputs);
    const args = axiom.getSendQueryArgs();
    expect(args?.value).toEqual(5105000000000000n);
  }, 30000);

  test("Set overrideAxiomQueryFee greater than standard payment", async () => {
    const axiom = new Axiom({
      ...config,
      options: {
        maxFeePerGas: "5000000000",
        overrideAxiomQueryFee: "50000000000000000",
      },
    });
    await axiom.init();
    await axiom.prove(inputs);
    const args = axiom.getSendQueryArgs();
    expect(args?.value).toEqual(52600000000000000n);
  }, 30000);

  test("Set overrideAxiomQueryFee less than standard payment", async () => {
    const axiom = new Axiom({
      ...config,
      options: {
        maxFeePerGas: "5000000000",
        overrideAxiomQueryFee: "50000000000",
      },
    });
    await axiom.init();
    await axiom.prove(inputs);
    const args = axiom.getSendQueryArgs();
    expect(args?.value).toEqual(5600000000000000n);
  }, 30000);
});
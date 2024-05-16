import { AxiomCrosschain, AxiomV2QueryOptions, BridgeType, SourceChainConfig, TargetChainConfig } from "../../../src";
import { circuit } from "../../circuits/quickstart/average.circuit";
import compiledCircuit from "../../circuits/quickstart/average.compiled.json";

describe("AxiomCrosschain tests", () => {
  const source: SourceChainConfig = {
    chainId: "11155111",
    rpcUrl: process.env.PROVIDER_URI_SEPOLIA as string,
    bridgeType: BridgeType.BlockhashOracle,
  };
  const target: TargetChainConfig = {
    chainId: "84532",
    rpcUrl: process.env.PROVIDER_URI_SEPOLIA as string,
    privateKey: process.env.PRIVATE_KEY_ANVIL as string,
  };
  const config = {
    circuit,
    compiledCircuit,
    source,
    target,
    callback: {
      target: "0x3b49DE82B86d677C072Dcc7ED47bcA9F20f0CF46",
    },
  };

  test("should initialize correctly", async () => {
    const axiomCrosschain = new AxiomCrosschain(config);
    expect(axiomCrosschain).toBeInstanceOf(AxiomCrosschain);
  });

  test("setOptions should update options correctly", () => {
    const axiomCrosschain = new AxiomCrosschain(config);
    const newOptions: AxiomV2QueryOptions = { callbackGasLimit: 500000 };
    axiomCrosschain.setOptions(newOptions);
    expect(axiomCrosschain.getOptions()).toMatchObject(newOptions);
  });

  test("sendQuery should fail without built args", async () => {
    const axiomCrosschain = new AxiomCrosschain(config);
    await expect(axiomCrosschain.sendQuery()).rejects.toThrow("SendQuery args have not been built yet. Please run `prove` first.");
  });

  test("prove should build sendQuery args correctly", async () => {
    const axiomCrosschain = new AxiomCrosschain(config);
    const inputs = {
      blockNumber: 4000000,
      address: "0xEaa455e4291742eC362Bc21a8C46E5F2b5ed4701",
    };
    await axiomCrosschain.init();
    const args = await axiomCrosschain.prove(inputs);
    console.log(args);
    expect(args?.args[0]).toEqual(source.chainId);
    expect(args?.args[2].resultLen).toEqual(3);
    expect(args?.args[3].target).toEqual(config.callback.target.toLowerCase());
    expect(args?.args[6]).toEqual("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");
  }, 20000);
});


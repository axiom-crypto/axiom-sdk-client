import { AxiomV2QueryBuilderBase, AxiomV2QueryBuilderBaseConfig } from "../../../src";

// Test coverage areas:
// - Basic initialization
// - DataQuery
// - ComputeQuery
// - Callback

describe("Basic Initialization", () => {
  test("should initialize without an API key", () => {
    const config: AxiomV2QueryBuilderBaseConfig = {
      providerUri: process.env.PROVIDER_URI_MAINNET as string,
      caller: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      version: "v2",
    };
    const ax = new AxiomV2QueryBuilderBase(config);
    expect(typeof ax).toEqual("object");
  });

  test("should initialize AxiomV2", () => {
    const config: AxiomV2QueryBuilderBaseConfig = {
      providerUri: process.env.PROVIDER_URI_MAINNET as string,
      caller: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      version: "v2",
    };
    const ax = new AxiomV2QueryBuilderBase(config);

    expect(typeof ax).toEqual("object");
  });

  test("should fail on invalid version number", () => {
    const config: AxiomV2QueryBuilderBaseConfig = {
      providerUri: process.env.PROVIDER_URI_MAINNET as string,
      caller: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      version: "v0.3",
    };
    expect(() => new AxiomV2QueryBuilderBase(config)).toThrow();
  });

  test("should set targetChainId to the same as (source) chainId", () => {
    const config: AxiomV2QueryBuilderBaseConfig = {
      providerUri: process.env.PROVIDER_URI_SEPOLIA as string,
      caller: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      sourceChainId: 11155111,
      version: "v2",
    };
    const ax = new AxiomV2QueryBuilderBase(config);
    expect(ax.config.sourceChainId).toEqual(ax.config.targetChainId);
  });
});

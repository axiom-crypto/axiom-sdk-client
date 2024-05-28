import { QueryBuilderBase, QueryBuilderBaseConfig } from "../../../src";

// Test coverage areas:
// - Basic initialization
// - DataQuery
// - ComputeQuery
// - Callback

describe("Basic Initialization", () => {
  test("should initialize without an API key", () => {
    const config: QueryBuilderBaseConfig = {
      rpcUrl: process.env.RPC_URL_MAINNET as string,
      version: "v2",
    };
    const ax = new QueryBuilderBase(config);
    expect(typeof ax).toEqual("object");
  });

  test("should initialize AxiomV2", () => {
    const config: QueryBuilderBaseConfig = {
      rpcUrl: process.env.RPC_URL_MAINNET as string,
      version: "v2",
    };
    const ax = new QueryBuilderBase(config);

    expect(typeof ax).toEqual("object");
  });

  test("should fail on invalid version number", () => {
    const config: QueryBuilderBaseConfig = {
      rpcUrl: process.env.RPC_URL_MAINNET as string,
      version: "v0.3",
    };
    expect(() => new QueryBuilderBase(config)).toThrow();
  });

  test("should set targetChainId to the same as (source) chainId", () => {
    const config: QueryBuilderBaseConfig = {
      rpcUrl: process.env.RPC_URL_SEPOLIA as string,
      sourceChainId: 11155111,
      version: "v2",
    };
    const ax = new QueryBuilderBase(config);
    expect(ax.config.sourceChainId).toEqual(ax.config.targetChainId);
  });
});

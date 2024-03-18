import { AxiomV2QueryBuilder, AxiomV2QueryBuilderConfig } from "../../../src";
import { Versions } from "../../../src/queryBuilder/constants";

// Test coverage areas:
// - Basic initialization
// - DataQuery
// - ComputeQuery
// - Callback

describe("Basic Initialization", () => {
  const BLOCK_NUMBER = 15537394;
  const WETH_ADDR = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const WETH_WHALE = "0x2E15D7AA0650dE1009710FDd45C3468d75AE1392";

  test("should initialize without an API key", () => {
    const config: AxiomV2QueryBuilderConfig = {
      provider: process.env.PROVIDER_URI_MAINNET as string,
      caller: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      version: "v2",
    };
    const ax = new AxiomV2QueryBuilder(config);
    expect(typeof ax).toEqual("object");
  });

  test("should initialize AxiomV2", () => {
    const config: AxiomV2QueryBuilderConfig = {
      provider: process.env.PROVIDER_URI_MAINNET as string,
      caller: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      version: "v2",
    };
    const ax = new AxiomV2QueryBuilder(config);

    expect(typeof ax).toEqual("object");
  });

  test("should fail on invalid version number", () => {
    const config: AxiomV2QueryBuilderConfig = {
      provider: process.env.PROVIDER_URI_MAINNET as string,
      caller: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      version: "v0.3",
    };
    expect(() => new AxiomV2QueryBuilder(config)).toThrow();
  });

  test("should set targetChainId to the same as (source) chainId", () => {
    const config: AxiomV2QueryBuilderConfig = {
      provider: process.env.PROVIDER_URI_SEPOLIA as string,
      caller: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      sourceChainId: 11155111,
      version: "v2",
    };
    const ax = new AxiomV2QueryBuilder(config);
    expect(ax.config.sourceChainId).toEqual(ax.config.targetChainId);
  });
});

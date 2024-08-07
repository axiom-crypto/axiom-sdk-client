import { PinataIpfsClient } from "@axiom-crypto/tools";
import {
  AxiomCrosschain,
  AxiomV2CircuitCapacity,
  AxiomV2QueryOptions,
  BridgeType,
  ChainConfig,
  TargetChainConfig,
  getAxiomV2QueryBlockhashOracleAddress,
} from "../../../src";
import { circuit } from "../../circuits/quickstart/average.circuit";
import compiledCircuit from "../../circuits/quickstart/average.compiled.json";

const MOCK_IPFS_HASH = "0xaa000000000000000000000000000000000000000000000000000000000000aa";

jest.mock("@axiom-crypto/tools", () => {
  const originalModule = jest.requireActual("@axiom-crypto/tools");
  return {
    ...originalModule,
    PinataIpfsClient: jest.fn().mockImplementation(() => {
      return {
        ...originalModule.PinataIpfsClient,
        pin: jest.fn().mockResolvedValue({ status: 200, value: MOCK_IPFS_HASH }),
      };
    }),
  };
});

describe("AxiomCrosschain tests", () => {
  const source: ChainConfig = {
    chainId: "11155111",
    rpcUrl: process.env.RPC_URL_11155111 as string,
  };
  const target: TargetChainConfig = {
    chainId: "84532",
    rpcUrl: process.env.RPC_URL_84532 as string,
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
    bridgeType: BridgeType.BlockhashOracle,
  };
  const inputs = {
    blockNumber: 4000000,
    address: "0xEaa455e4291742eC362Bc21a8C46E5F2b5ed4701",
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

  test("sendQuery should fail without built args (without init)", async () => {
    const axiomCrosschain = new AxiomCrosschain(config);
    await expect(axiomCrosschain.sendQuery()).rejects.toThrow("SendQuery args have not been built yet. Please run `prove` first.");
  });

  test("sendQuery should fail without built args (with init)", async () => {
    const axiomCrosschain = new AxiomCrosschain(config);
    await axiomCrosschain.init();
    await expect(axiomCrosschain.sendQuery()).rejects.toThrow("SendQuery args have not been built yet. Please run `prove` first.");
  });

  test("prove should build sendQuery args correctly", async () => {
    const queryAddr = getAxiomV2QueryBlockhashOracleAddress({
      targetChainId: target.chainId,
      sourceChainId: source.chainId,
    });
    const axiomCrosschain = new AxiomCrosschain(config);
    await axiomCrosschain.init();
    const args = await axiomCrosschain.prove(inputs);
    expect(args?.address).toEqual(queryAddr);
    expect(args?.args[0]).toEqual(source.chainId);
    expect(args?.args[1]).toEqual("0x7dae14e73f4129746db078a6ecb12c94548985a85d8256477d8dd118a6df1a6a");
    expect(args?.args[2].k).toEqual(13);
    expect(args?.args[2].resultLen).toEqual(3);
    expect(args?.args[3].target).toEqual(config.callback.target.toLowerCase());
    expect(args?.args[3].extraData).toEqual("0x");
    expect(args?.args[4].callbackGasLimit).toEqual(100000);
    expect(BigInt(args?.args[4].overrideAxiomQueryFee)).toBeGreaterThan(BigInt("3000000000000000")); // will not be "0" on an L2
    expect(args?.args[6]).toEqual("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");
  }, 40000);

  test("sendQueryWithIpfs with ipfsClient", async () => {
    const axiomCrosschain = new AxiomCrosschain({
      ...config,
      options: {
        ipfsClient: new PinataIpfsClient("MOCK_JWT"),
      },
    });
    await axiomCrosschain.init();
    const args = await axiomCrosschain.prove(inputs);
    expect(args?.args[1]).toEqual(MOCK_IPFS_HASH);
  }, 40000);

  test("sendQueryWithIpfs should throw error without ipfsClient", async () => {
    const axiomCrosschain = new AxiomCrosschain(config);
    await expect(axiomCrosschain.sendQueryWithIpfs()).rejects.toThrow("Setting `ipfsClient` is required to send a Query with IPFS");
  });

  test("should set override query address correctly", async () => {
    const queryAddr = "0x1234567890123456789012345678901234567890";
    const axiomCrosschain = new AxiomCrosschain({
      ...config,
      options: {
        overrides: {
          queryAddress: queryAddr,
        },
      },
    });
    await axiomCrosschain.init();
    const args = await axiomCrosschain.prove(inputs);
    expect(args?.address).toEqual(queryAddr);
  }, 40000);

  test('should prove & build query with caller', async () => {
    const caller = "0xEaa455e4291742eC362Bc21a8C46E5F2b5ed4701";
    const configCaller = {
      ...config,
      target: {
        chainId: "84532",
        rpcUrl: process.env.RPC_URL_84532 as string,
        caller,
      },
    };
    const axiomCrosschain = new AxiomCrosschain(configCaller);
    expect(axiomCrosschain).toBeInstanceOf(AxiomCrosschain);
    await axiomCrosschain.init();
    const args = await axiomCrosschain.prove(inputs);
    expect(args?.args[6]).toEqual(caller.toLowerCase());
  }, 40000);

  test('should prove & build a query with caller and privateKey', async () => {
    const caller = "0xEaa455e4291742eC362Bc21a8C46E5F2b5ed4701";
    const newConfig = {
      ...config,
      target: {
        ...config.target,
        caller,
      },
    };
    const axiomCrosschain = new AxiomCrosschain(newConfig);
    expect(axiomCrosschain).toBeInstanceOf(AxiomCrosschain);
    await axiomCrosschain.init();
    const args = await axiomCrosschain.prove(inputs);
    expect(args?.args[6]).toEqual("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");
  }, 40000);

  test('should prove & build a query with caller, privateKey, and refundee', async () => {
    const caller = "0xEaa455e4291742eC362Bc21a8C46E5F2b5ed4701";
    const refundee = "0x000000000000000000000000000000000000aabb";
    const newConfig = {
      ...config,
      target: {
        ...config.target,
        caller,
      },
      options: {
        refundee,
      },
    };
    const axiomCrosschain = new AxiomCrosschain(newConfig);
    expect(axiomCrosschain).toBeInstanceOf(AxiomCrosschain);
    await axiomCrosschain.init();
    const args = await axiomCrosschain.prove(inputs);
    expect(args?.args[6]).toEqual(refundee);
  }, 40000);

  test('should prove & build a query with privateKey and refundee', async () => {
    const refundee = "0x000000000000000000000000000000000000aabb";
    const newConfig = {
      ...config,
      options: {
        refundee,
      },
    };
    const axiomCrosschain = new AxiomCrosschain(newConfig);
    expect(axiomCrosschain).toBeInstanceOf(AxiomCrosschain);
    await axiomCrosschain.init();
    const args = await axiomCrosschain.prove(inputs);
    expect(args?.args[6]).toEqual(refundee);
  }, 40000);

  test('should be able to set a non-default capacity (but SNARK proof will fail to verify)', async () => {
    const capacity: AxiomV2CircuitCapacity = {
      maxOutputs: 64,
      maxSubqueries: 64,
    }
    const axiomCrosschain = new AxiomCrosschain({
      ...config,
      capacity,
    });
    await axiomCrosschain.init();
    await expect(axiomCrosschain.prove(inputs)).rejects.toThrow("unreachable");
  }, 40000);
});

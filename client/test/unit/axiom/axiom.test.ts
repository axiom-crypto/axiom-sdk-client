import { PinataIpfsClient } from "@axiom-crypto/tools";
import { Axiom, AxiomV2CircuitCapacity, AxiomV2QueryOptions } from "../../../src";
import { circuit } from "../../circuits/quickstart/average.circuit";
import compiledCircuit from "../../circuits/quickstart/average.compiled.json";

const chainId = process.env.CHAIN_ID || "11155111"
const rpcUrl = process.env[`RPC_URL_${chainId}`] as string;

const MOCK_TX_HASH = "0x1234567890123456789012345678901234567890123456789012345678901234";
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

describe('Axiom class tests', () => {
  const config = {
    chainId,
    rpcUrl,
    circuit,
    compiledCircuit,
    callback: {
      target: '0x4A4e2D8f3fBb3525aD61db7Fc843c9bf097c362e',
    },
    privateKey: process.env.PRIVATE_KEY_ANVIL as string,
  };
  const inputs = {
    blockNumber: 4000000,
    address: "0xEaa455e4291742eC362Bc21a8C46E5F2b5ed4701",
  };

  test('should initialize correctly', async () => {
    const axiom = new Axiom(config);
    expect(axiom).toBeInstanceOf(Axiom);
  });

  test('setOptions should update options correctly', () => {
    const axiom = new Axiom(config);
    const newOptions: AxiomV2QueryOptions = { callbackGasLimit: 500000 };
    axiom.setOptions(newOptions);
    expect(axiom.getOptions()).toMatchObject(newOptions);
  });

  test('sendQuery should fail without built args (without init)', async () => {
    const axiom = new Axiom(config);
    await expect(axiom.sendQuery()).rejects.toThrow('SendQuery args have not been built yet. Please run `prove` first.');
  });

  test('sendQuery should fail without built args (with init)', async () => {
    const axiom = new Axiom(config);
    await axiom.init();
    await expect(axiom.sendQuery()).rejects.toThrow("SendQuery args have not been built yet. Please run `prove` first.");
  }, 40000);

  test('prove should build sendQuery args correctly', async () => {
    const axiom = new Axiom(config);
    await axiom.init();
    const args = await axiom.prove(inputs);
    expect(args?.args[0]).toEqual(chainId);
    expect(args?.args[2].resultLen).toEqual(3);
    expect(args?.args[3].target).toEqual(config.callback.target.toLowerCase());
    expect(args?.args[6]).toEqual("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");
  }, 40000);

  test("sendQueryWithIpfs with ipfsClient", async () => {
    const axiom = new Axiom({
      ...config,
      options: {
        ipfsClient: new PinataIpfsClient("MOCK_JWT"),
      },
    });
    await axiom.init();
    const args = await axiom.prove(inputs);
    expect(args?.args[1]).toEqual(MOCK_IPFS_HASH);
  }, 40000);

  test('sendQueryWithIpfs should throw error without ipfsClient', async () => {
    const axiom = new Axiom(config);
    await expect(axiom.sendQueryWithIpfs()).rejects.toThrow("Setting `ipfsClient` is required to send a Query with IPFS");
  });

  test("should set override query address correctly", async () => {
    const queryAddr = "0x1234567890123456789012345678901234567890";
    const axiom = new Axiom({
      ...config,
      options: {
        overrides: {
          queryAddress: queryAddr,
        },
      },
    });
    await axiom.init();
    const args = await axiom.prove(inputs);
    expect(args?.address).toEqual(queryAddr);
  }, 40000);

  test('should prove & build query with caller', async () => {
    const caller = "0xEaa455e4291742eC362Bc21a8C46E5F2b5ed4701";
    const configCaller = {
      chainId,
      rpcUrl,
      circuit,
      compiledCircuit,
      callback: {
        target: '0x4A4e2D8f3fBb3525aD61db7Fc843c9bf097c362e',
      },
      caller,
    };
    const axiom = new Axiom(configCaller);
    expect(axiom).toBeInstanceOf(Axiom);
    await axiom.init();
    const args = await axiom.prove(inputs);
    expect(args?.args[6]).toEqual(caller.toLowerCase());
  }, 40000);

  test('should prove & build a query with caller and privateKey', async () => {
    const caller = "0xEaa455e4291742eC362Bc21a8C46E5F2b5ed4701";
    const axiom = new Axiom({
      ...config,
      caller,
    });
    expect(axiom).toBeInstanceOf(Axiom);
    await axiom.init();
    const args = await axiom.prove(inputs);
    expect(args?.args[6]).toEqual("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");
  }, 40000);

  test('should prove & build a query with caller, privateKey, and refundee', async () => {
    const caller = "0xEaa455e4291742eC362Bc21a8C46E5F2b5ed4701";
    const refundee = "0x000000000000000000000000000000000000aabb";
    const axiom = new Axiom({
      ...config,
      caller,
      options: {
        refundee,
      },
    });
    expect(axiom).toBeInstanceOf(Axiom);
    await axiom.init();
    const args = await axiom.prove(inputs);
    expect(args?.args[6]).toEqual(refundee);
  }, 40000);

  test('should prove & build a query with privateKey and refundee', async () => {
    const refundee = "0x000000000000000000000000000000000000aabb";
    const axiom = new Axiom({
      ...config,
      options: {
        refundee,
      },
    });
    await axiom.init();
    await axiom.prove(inputs);
    const args = axiom.getSendQueryArgs();
    expect(args?.args[6]).toEqual(refundee);
  }, 40000);

  test('should be able to set a non-default capacity (but SNARK proof will fail to verify)', async () => {
    const capacity: AxiomV2CircuitCapacity = {
      maxOutputs: 64,
      maxSubqueries: 64,
    }
    const axiom = new Axiom({
      ...config,
      capacity,
    });
    await axiom.init();
    await expect(axiom.prove(inputs)).rejects.toThrow("unreachable");
  }, 40000);
});


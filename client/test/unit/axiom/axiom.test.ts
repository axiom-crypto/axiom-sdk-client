import { Axiom, AxiomV2QueryOptions } from "../../../src";
import { circuit } from "../../circuits/quickstart/average.circuit";
import compiledCircuit from "../../circuits/quickstart/average.compiled.json";

const chainId = process.env.CHAIN_ID || "11155111"
const rpcUrl = process.env[`PROVIDER_URI_${chainId}`] as string;

describe('Axiom class tests', () => {
  const config = {
    chainId,
    rpcUrl,
    circuit,
    compiledCircuit,
    callback: {
      target: '0x4A4e2D8f3fBb3525aD61db7Fc843c9bf097c362e',
    },
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

  test('sendQuery should fail without built args', async () => {
    const axiom = new Axiom({
      ...config,
      privateKey: process.env.PRIVATE_KEY_ANVIL as string,
    });
    await expect(axiom.sendQuery()).rejects.toThrow('SendQuery args have not been built yet. Please run `prove` first.');
  });

  test('prove should build sendQuery args correctly', async () => {
    const axiom = new Axiom({
      ...config,
      privateKey: process.env.PRIVATE_KEY_ANVIL as string,
    });
    const inputs = {
      blockNumber: 4000000,
      address: "0xEaa455e4291742eC362Bc21a8C46E5F2b5ed4701",
    };
    await axiom.init();
    await axiom.prove(inputs);
    const args = axiom.getSendQueryArgs();
    expect(args?.args[0]).toEqual(chainId);
    expect(args?.args[2].resultLen).toEqual(3);
    expect(args?.args[3].target).toEqual(config.callback.target.toLowerCase());
    expect(args?.args[6]).toEqual("0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");
  }, 40000);

  test('sendQueryWithIpfs should throw error without ipfsClient', async () => {
    const axiom = new Axiom({
      ...config,
      privateKey: process.env.PRIVATE_KEY_ANVIL as string,
    });
    await expect(axiom.sendQueryWithIpfs()).rejects.toThrow("Setting `ipfsClient` is required to send a Query with IPFS");
  });

  test('should build query with caller', async () => {
    expect(false).toBeTruthy();
  }, 40000);

  test('should build a query with caller and privateKey', async () => {
    expect(false).toBeTruthy();
  }, 40000);

  test('should build a query with caller, privateKey, and refundee', async () => {
    expect(false).toBeTruthy();
  }, 40000);

  test('should build a query with privateKey and refundee', async () => {
    const axiom = new Axiom({
      ...config,
      privateKey: process.env.PRIVATE_KEY_ANVIL as string,
      options: {
        refundee: "0x000000000000000000000000000000000000aabb",
      },
    });
    const inputs = {
      blockNumber: 4000000,
      address: "0xEaa455e4291742eC362Bc21a8C46E5F2b5ed4701",
    };
    await axiom.init();
    await axiom.prove(inputs);
    const args = axiom.getSendQueryArgs();
    expect(args?.args[6]).toEqual("0x000000000000000000000000000000000000aabb");
  }, 40000);
});


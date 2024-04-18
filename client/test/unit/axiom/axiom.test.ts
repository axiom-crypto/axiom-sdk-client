import { Axiom } from '../../../src/axiom/axiom';
import { circuit } from "../../circuits/quickstart/average.circuit";
import compiledCircuit from "../../circuits/quickstart/average.compiled.json";
import { viemChain } from '../../../src/lib/viem';
import { createPublicClient, http } from 'viem';
import { AxiomV2QueryOptions } from '../../../src';

const chainId = process.env.CHAIN_ID || "11155111"
const provider = process.env[`PROVIDER_URI_${chainId}`] as string;

describe('Axiom class tests', () => {
  const config = {
    chainId,
    provider,
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
    const axiom = new Axiom(config);
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
  }, 20000);

  test('sendQueryWithIpfs should throw error without ipfsClient', async () => {
    const axiom = new Axiom({
      ...config,
      privateKey: process.env.PRIVATE_KEY_ANVIL as string,
    });
    await expect(axiom.sendQueryWithIpfs()).rejects.toThrow("Setting `ipfsClient` is required to send a Query with IPFS");
  });
});
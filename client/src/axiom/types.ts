import { AxiomV2CircuitCapacity, AxiomV2CircuitConfig, CircuitConfig } from "@axiom-crypto/circuit/types";
import {
  AxiomV2Callback,
  AxiomV2ComputeQuery,
  AxiomV2FeeData,
  AxiomV2QueryOptions,
  ByteLengths,
  IpfsClient,
} from "@axiom-crypto/core";

const solidityTypes = Object.keys(ByteLengths);
const solidityInputTypes = [...solidityTypes, ...solidityTypes.map((type: string) => `${type}[]`)] as const;
export type CircuitInputType = typeof solidityInputTypes[number];

export interface AxiomV2ClientConfig<T> {
  circuit: (inputs: T) => Promise<void>;
  compiledCircuit: AxiomV2CompiledCircuit;
  chainId: string;
  provider: string;
  privateKey?: string;
  version?: string;
  callback: AxiomV2CallbackInput;
  ipfsClient?: IpfsClient;
}

export interface AxiomV2CallbackInput {
  target: string;
  extraData?: string;
}

export interface AxiomV2CompiledCircuit {
  vk: string;
  config: AxiomV2CircuitConfig,
  querySchema: string;
  inputSchema: string;
  circuit: string;
}

export interface AxiomV2ClientOptions extends AxiomV2QueryOptions {
  caller?: string;
  privateKey?: string;
  validate?: boolean;
  ipfsClient?: IpfsClient;
}

export interface AxiomV2SendQueryArgs {
  address: string;
  abi: any;
  functionName: string;
  value: bigint;
  args: any[];
  queryId: string;
  calldata: string;
}

export interface AxiomV2SendQueryArgsParams {
  sourceChainId: string,
  dataQueryHash: string,
  computeQuery: AxiomV2ComputeQuery,
  callback: AxiomV2Callback,
  feeData: AxiomV2FeeData,
  userSalt: string,
  refundee: string,
  dataQuery: string,
}
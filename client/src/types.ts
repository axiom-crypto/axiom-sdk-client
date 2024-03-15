import {
  AxiomV2Callback,
  AxiomV2CircuitCapacity,
  AxiomV2ComputeQuery,
  AxiomV2FeeData,
  AxiomV2QueryOptions,
  CircuitConfig,
} from "@axiom-crypto/circuit";
import {
  ByteLengths,
  IpfsClient,
} from "@axiom-crypto/circuit/pkg/tools";

const solidityTypes = Object.keys(ByteLengths);
const solidityInputTypes = [...solidityTypes, ...solidityTypes.map((type: string) => `${type}[]`)] as const;
export type CircuitInputType = typeof solidityInputTypes[number];

export interface AxiomV2ClientConfig<T> {
  circuit: (inputs: T) => Promise<void>;
  compiledCircuit: AxiomV2CompiledCircuit;
  chainId: string;
  provider: string;
  callback: AxiomV2CallbackInput;
  privateKey?: string;
  version?: string;
  capacity?: AxiomV2CircuitCapacity;
  ipfsClient?: IpfsClient;
}

export interface AxiomV2CallbackInput {
  target: string;
  extraData?: string;
}

export interface AxiomV2CompiledCircuit {
  vk: string;
  config: CircuitConfig;
  querySchema: string;
  inputSchema: string;
  circuit: string;
  capacity?: AxiomV2CircuitCapacity;
}

export interface AxiomV2ClientOptions extends AxiomV2QueryOptions {
  caller?: string;
  privateKey?: string;
  validate?: boolean;
  ipfsClient?: IpfsClient;
  queryAddress?: string;
}

export interface AxiomV2SendQueryArgs {
  address: string;
  abi: any;
  functionName: string;
  value: bigint;
  args: any[];
  queryId: string;
  mock: boolean;
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

export interface AxiomV2ClientOverrides {
  queryAddress?: string;
  validateBuild?: boolean;
}

export enum AbiType {
  Query,
}
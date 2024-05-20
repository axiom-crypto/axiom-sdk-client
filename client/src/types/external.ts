import {
  AxiomV2Callback,
  AxiomV2CircuitCapacity,
  AxiomV2ComputeQuery,
  AxiomV2FeeData,
  CircuitConfig,
} from "@axiom-crypto/circuit";
import {
  ByteLengths,
  IpfsClient,
} from "@axiom-crypto/circuit/pkg/tools";
import { CoreConfigCircuit, CrosschainConfig } from "./internal";

const solidityTypes = Object.keys(ByteLengths);
const solidityInputTypes = [...solidityTypes, ...solidityTypes.map((type: string) => `${type}[]`)] as const;
export type CircuitInputType = typeof solidityInputTypes[number];

// Types combined in this way to support React component
export interface AxiomV2ClientConfig<T> extends CoreConfigCircuit<T>, ClientConfig {}

// Types combined in this way to support React component
export interface AxiomV2ClientCrosschainConfig<T> extends CoreConfigCircuit<T>, CrosschainConfig {}

export enum BridgeType {
  Broadcaster,
  BlockhashOracle,
}

export interface ChainConfig {
  chainId: string;
  rpcUrl: string;
}

export interface ClientConfig {
  chainId: string;
  rpcUrl: string;
  privateKey?: string;
  caller?: string;
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

export interface AxiomV2QueryOptions {
  maxFeePerGas?: string;
  callbackGasLimit?: number;
  overrideAxiomQueryFee?: string;
  refundee?: string;
  ipfsClient?: IpfsClient;
  overrides?: AxiomV2ClientOverrides;
}

export interface AxiomV2FeeDataExtended extends AxiomV2FeeData {
  axiomQueryFee: bigint;
  proofVerificationGas: bigint;
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

export interface ChainDefaults {
  maxFeePerGasWei: bigint;
  minMaxFeePerGasWei: bigint;
  callbackGasLimit: bigint;
  proofVerificationGas: bigint;
  axiomQueryFeeWei: bigint;
}

export {
  AxiomV2Callback,
  AxiomV2ComputeQuery,
  AxiomV2DataQuery,
  AxiomV2FeeData,
} from "@axiom-crypto/circuit";

export enum AbiType {
  Query,
}
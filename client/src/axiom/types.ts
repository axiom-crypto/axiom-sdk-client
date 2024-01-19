import { 
  AxiomV2Callback,
  AxiomV2ComputeQuery, 
  AxiomV2FeeData,
  AxiomV2QueryOptions,
  ByteLengths,
} from "@axiom-crypto/core";

const solidityTypes = Object.keys(ByteLengths);
const solidityInputTypes = [...solidityTypes, ...solidityTypes.map((type: string) => `${type}[]`)] as const;
export type CircuitInputType = typeof solidityInputTypes[number];

export interface AxiomV2ClientConfig<T> {
  circuit: (inputs: T) => Promise<void>;
  compiledCircuit: AxiomV2CompiledCircuit;
  inputSchema: {[arg: string]: CircuitInputType};
  chainId: string;
  provider: string;
  privateKey?: string;
  version?: string;
  mock?: boolean;
  callback: AxiomV2CallbackInput;
}

export interface AxiomV2CallbackInput {
  target: string;
  extraData?: string;
}

export interface AxiomV2CompiledCircuit {
  vk: string;
  config: {
    k: number;
    numAdvice: number;
    numLookupAdvice: number;
    numInstance: number;
    numLookupBits: number;
    numVirtualInstance: number;
  };
  querySchema: string;
  inputSchema: string;
  circuit: string;
}

export interface AxiomV2ClientOptions extends AxiomV2QueryOptions {
  caller?: string;
  privateKey?: string;
  validate?: boolean;
  maximumMaxFeePerGas?: string;
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
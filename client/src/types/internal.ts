import {
  AxiomV2CircuitCapacity,
} from "@axiom-crypto/circuit";
import { 
  AxiomV2CallbackInput,
  AxiomV2CompiledCircuit,
  AxiomV2QueryOptions,
  SourceChainConfig,
  TargetChainConfig,
} from "./external";

export interface CoreConfig {
  compiledCircuit: AxiomV2CompiledCircuit;
  callback: AxiomV2CallbackInput;
  capacity?: AxiomV2CircuitCapacity;
  options?: AxiomV2QueryOptions;
}

export interface ClientConfig {
  chainId: string;
  rpcUrl: string;
  privateKey?: string;
  caller?: string;
}

export interface CoreConfigCircuit<T> extends CoreConfig {
  circuit: (inputs: T) => Promise<void>;
}

export interface CrosschainConfig {
  source: SourceChainConfig;
  target: TargetChainConfig;
}
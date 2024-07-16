import {
  AxiomV2CircuitCapacity,
} from "@axiom-crypto/circuit";
import { 
  AxiomV2CallbackInput,
  AxiomV2CompiledCircuit,
  AxiomV2QueryOptions,
  ChainConfig,
  TargetChainConfig,
  BridgeType,
} from "./external";

export interface CoreConfig {
  compiledCircuit: AxiomV2CompiledCircuit;
  callback: AxiomV2CallbackInput;
  capacity?: AxiomV2CircuitCapacity;
  options?: AxiomV2QueryOptions;
}

export interface CoreConfigCircuit<T> extends CoreConfig {
  circuit: (inputs: T) => Promise<void>;
}

export interface CrosschainConfig {
  source: ChainConfig;
  target: TargetChainConfig;
  bridgeType: BridgeType;
  bridgeId?: number;
}

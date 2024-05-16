import {
  AxiomV2CircuitCapacity,
} from "@axiom-crypto/circuit";
import { 
  AxiomV2CallbackInput,
  AxiomV2CompiledCircuit,
  AxiomV2QueryOptions,
} from "./external";

export interface CoreConfig<T> {
  circuit: (inputs: T) => Promise<void>;
  compiledCircuit: AxiomV2CompiledCircuit;
  callback: AxiomV2CallbackInput;
  capacity?: AxiomV2CircuitCapacity;
  options?: AxiomV2QueryOptions;
}

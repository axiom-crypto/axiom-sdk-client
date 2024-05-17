import { expose } from "comlink";
import { Axiom, AxiomV2Callback, AxiomV2CircuitCapacity, AxiomV2CompiledCircuit } from "@axiom-crypto/client";

export class AxiomWorker {
  constructor(
    inputs: {
      chainId: number | string | bigint,
      rpcUrl: string,
      circuit: (inputs: unknown) => Promise<void>,
      compiledCircuit: AxiomV2CompiledCircuit,
      callback: AxiomV2Callback,
      inputSchema?: string,
      shouldTime?: boolean,
      capacity?: AxiomV2CircuitCapacity,
    }
  ) {
    const axiom = new Axiom({
      chainId: inputs.chainId.toString(),
      rpcUrl: inputs.rpcUrl,
      circuit: inputs.circuit,
      compiledCircuit: inputs.compiledCircuit,
      capacity: inputs.capacity,
      callback: inputs.callback,
    });
  }
}

expose(AxiomWorker);
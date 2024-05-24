import {
  AxiomV2ClientCrosschainConfig,
} from "../../types";
import {
  DEFAULT_CAPACITY,
} from "@axiom-crypto/circuit";
import { AxiomBaseCircuit } from "@axiom-crypto/circuit/js";
import { AxiomCrosschainBase } from "../axiomCrosschainBase";

export class AxiomCrosschain<T> extends AxiomCrosschainBase<T, AxiomBaseCircuit<T>> {
  constructor(config: AxiomV2ClientCrosschainConfig<T>) {
    const capacity = config.capacity ?? config.compiledCircuit.capacity ?? DEFAULT_CAPACITY;
    const axiomBaseCircuit = new AxiomBaseCircuit({
      f: config.circuit,
      rpcUrl: config.source.rpcUrl,
      inputSchema: config.compiledCircuit.inputSchema,
      chainId: config.source.chainId,
      capacity,
    });
    super(config, axiomBaseCircuit, 0);
  }
}

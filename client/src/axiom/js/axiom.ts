import {
  AxiomV2ClientConfig,
} from "../../types";
import {
  DEFAULT_CAPACITY,
} from "@axiom-crypto/circuit";
import { AxiomBaseCircuit } from "@axiom-crypto/circuit/js";
import { AxiomSinglechainBase } from "../axiomSinglechainBase";

export class Axiom<T> extends AxiomSinglechainBase<T, AxiomBaseCircuit<T>> {  
  constructor(config: AxiomV2ClientConfig<T>) {
    const capacity = config.capacity ?? config.compiledCircuit.capacity ?? DEFAULT_CAPACITY;
    const axiomBaseCircuit = new AxiomBaseCircuit({
      f: config.circuit,
      rpcUrl: config.rpcUrl,
      inputSchema: config.compiledCircuit.inputSchema,
      chainId: config.chainId,
      capacity,
    });
    super(config, axiomBaseCircuit);
  }
}
import { CoreConfig } from "@axiom-crypto/client/types/internal";

export abstract class AxiomCoreWorker {
  constructor(config: CoreConfig, numThreads: number) {
    const decodedArray = Buffer.from(config.compiledCircuit.circuit, 'base64');
    const decoder = new TextDecoder();
    const raw = decoder.decode(decodedArray);
    const AXIOM_CLIENT_IMPORT = require("@axiom-crypto/client/lib/react");
    const newConfig = {
      ...config,
      circuit: eval(raw),
    };
    // Initialize the worker with the newConfig
  }
}

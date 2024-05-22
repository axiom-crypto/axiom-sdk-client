import { expose } from "comlink";
import { Axiom } from "@axiom-crypto/client/axiom/web/";
import { CoreConfig } from "@axiom-crypto/client/types/internal";
import { TargetChainConfig } from "@axiom-crypto/client/types";

interface ReactClientConfig extends CoreConfig, TargetChainConfig {}

export class AxiomWorker<T> extends Axiom<T> {
  constructor(config: ReactClientConfig, numThreads: number) {
    const decodedArray = Buffer.from(config.compiledCircuit.circuit, 'base64');
    const decoder = new TextDecoder();
    const raw = decoder.decode(decodedArray);
    const AXIOM_CLIENT_IMPORT = require("@axiom-crypto/client/lib/react");
    const newConfig = {
      ...config,
      circuit: eval(raw),
    };
    super(newConfig, numThreads);
  }
}

expose(AxiomWorker);

import { expose } from "comlink";
import { Axiom } from "@axiom-crypto/client/axiom/web/";
import { CoreConfig, ClientConfig } from "@axiom-crypto/client/types/internal";

interface ReactClientConfig extends CoreConfig, ClientConfig {}

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

expose(Axiom);
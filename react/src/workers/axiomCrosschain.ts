import { expose } from "comlink";
import { AxiomCrosschain } from "@axiom-crypto/client/axiom/web/";
import { CoreConfig, CrosschainConfig } from "@axiom-crypto/client/types/internal";

interface ReactCrosschainConfig extends CoreConfig, CrosschainConfig {}

export class AxiomCrosschainWorker<T> extends AxiomCrosschain<T> {
  constructor(config: ReactCrosschainConfig, numThreads: number) {
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

expose(AxiomCrosschainWorker);

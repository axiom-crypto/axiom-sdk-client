import { expose } from "comlink";
import { AxiomCrosschain } from "@axiom-crypto/client/axiom/web/";

// export class AxiomWorker {
//   constructor(
//     inputs: {
//       chainId: number | string | bigint,
//       rpcUrl: string,
//       circuit: (inputs: unknown) => Promise<void>,
//       compiledCircuit: AxiomV2CompiledCircuit,
//       callback: AxiomV2Callback,
//       inputSchema?: string,
//       shouldTime?: boolean,
//       capacity?: AxiomV2CircuitCapacity,
//     }
//   ) {
//     const axiom = new Axiom({
//       chainId: inputs.chainId.toString(),
//       rpcUrl: inputs.rpcUrl,
//       circuit: inputs.circuit,
//       compiledCircuit: inputs.compiledCircuit,
//       capacity: inputs.capacity,
//       callback: inputs.callback,
//     });
//   }
// }

expose(AxiomCrosschain);
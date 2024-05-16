import { AxiomV2Callback, AxiomV2CircuitCapacity } from "@axiom-crypto/circuit";
import { AxiomBaseCircuit } from "@axiom-crypto/circuit/web/";
import { buildSendQuery } from "../sendQuery";
import { AxiomV2QueryOptions, AxiomV2SendQueryArgs } from "../types";

// export class AxiomCircuit<T> extends AxiomBaseCircuit<T> {
//   constructor(inputs: {
//     provider: string,
//     f: (inputs: T) => Promise<void>,
//     inputSchema?: string,
//     mock?: boolean,
//     chainId?: number | string | bigint,
//     shouldTime?: boolean,
//     capacity?: AxiomV2CircuitCapacity
//   }) {
//     super(inputs);
//   }

//   async getSendQueryArgs(input: {
//     callbackTarget: string;
//     callbackExtraData: string;
//     callerAddress: string;
//     options: AxiomV2QueryOptions;
//   }): Promise<AxiomV2SendQueryArgs> {
//     if (!this.chainId) throw new Error("No chain ID provided");
//     if (!this.computeQuery) throw new Error("No compute query generated");
//     const callback: AxiomV2Callback = {
//       target: input.callbackTarget,
//       extraData: input.callbackExtraData,
//     };
//     return await buildSendQuery({
//       chainId: this.chainId,
//       providerUri: this.provider,
//       dataQuery: this.dataQuery,
//       computeQuery: this.computeQuery,
//       callback,
//       caller: input.callerAddress,
//       mock: this.isMock ?? false,
//       options: input.options,
//     });
//   }
// }

export { AxiomBaseCircuit } from "@axiom-crypto/circuit/web/";
export * from "../sendQuery";
export * from "@axiom-crypto/circuit";
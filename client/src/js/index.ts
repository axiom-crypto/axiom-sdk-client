import { AxiomBaseCircuit } from "@axiom-crypto/circuit/js/";
import { AxiomV2Callback } from "@axiom-crypto/core";
import { buildSendQuery } from "../sendQuery";
import { AxiomV2ClientOptions } from "../axiom";
import { AxiomV2CircuitCapacity } from "@axiom-crypto/circuit/types";

export class AxiomCircuit<T> extends AxiomBaseCircuit<T> {
  constructor(inputs: {
    provider: string,
    f: (inputs: T) => Promise<void>,
    inputSchema?: string,
    mock?: boolean,
    chainId?: number | string | bigint,
    shouldTime?: boolean,
    capacity?: AxiomV2CircuitCapacity,
  }) {
    super(inputs);
  }

  async getSendQueryArgs(input: {
    callbackTarget: string;
    callbackExtraData: string;
    callerAddress: string;
    options: AxiomV2ClientOptions;
  }) {
    if (!this.computeQuery) throw new Error("No compute query generated");
    const axiomCallback: AxiomV2Callback = {
      target: input.callbackTarget,
      extraData: input.callbackExtraData,
    };
    return await buildSendQuery({
      axiom: this.axiom,
      dataQuery: this.dataQuery,
      computeQuery: this.computeQuery,
      callback: axiomCallback,
      caller: input.callerAddress,
      options: input.options,
    });
  }
}

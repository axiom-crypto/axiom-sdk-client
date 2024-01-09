import { AxiomBaseCircuit } from "@axiom-crypto/circuit/js/";
import { AxiomV2Callback, AxiomV2QueryOptions } from "@axiom-crypto/core";
import { buildSendQuery } from "../sendQuery";

export class AxiomCircuit<T> extends AxiomBaseCircuit<T> {
  constructor(inputs: {
    provider: string,
    f: (inputs: T) => Promise<void>,
    inputSchema?: string,
    mock?: boolean,
    chainId?: number | string | bigint,
    shouldTime?: boolean
  }) {
    super(inputs);
  }

  async getSendQueryArgs(input: {
    callbackAddress: string;
    callbackExtraData: string;
    callerAddress: string;
    options: AxiomV2QueryOptions;
  }) {
    if (!this.computeQuery) throw new Error("No compute query generated");
    const axiomCallback: AxiomV2Callback = {
      target: input.callbackAddress,
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

export * from "../index";
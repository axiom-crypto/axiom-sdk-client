import { AxiomV2Callback, AxiomV2CircuitCapacity } from "@axiom-crypto/circuit";
import { AxiomBaseCircuit } from "@axiom-crypto/circuit/js/";
import { buildSendQuery } from "../sendQuery";
import { AxiomV2ClientOptions, AxiomV2SendQueryArgs } from "../types";
import { AxiomV2QueryBuilderClient } from "../queryBuilderClient";

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
  }): Promise<AxiomV2SendQueryArgs> {
    if (!this.computeQuery) throw new Error("No compute query generated");
    const callback: AxiomV2Callback = {
      target: input.callbackTarget,
      extraData: input.callbackExtraData,
    };
    const queryBuilderClient = new AxiomV2QueryBuilderClient(
      this.queryBuilderBase.config,
      this.queryBuilderBase.getDataQuery(),
      this.queryBuilderBase.getComputeQuery(),
      callback,
      input.options,
    );
    return await buildSendQuery({
      queryBuilderClient,
      dataQuery: this.dataQuery,
      computeQuery: this.computeQuery,
      callback,
      caller: input.callerAddress,
      options: input.options,
    });
  }
}

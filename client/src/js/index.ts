import { AxiomV2Callback, AxiomV2CircuitCapacity } from "@axiom-crypto/circuit";
import { AxiomBaseCircuit } from "@axiom-crypto/circuit/js/";
import { buildSendQuery } from "../sendQuery";
import { AxiomV2QueryOptions, AxiomV2SendQueryArgs } from "../types";
import { QueryBuilderClient, QueryBuilderClientConfig } from "../queryBuilderClient";

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
    options: AxiomV2QueryOptions;
  }): Promise<AxiomV2SendQueryArgs> {
    if (!this.computeQuery) throw new Error("No compute query generated");
    const callback: AxiomV2Callback = {
      target: input.callbackTarget,
      extraData: input.callbackExtraData,
    };
    const config: QueryBuilderClientConfig = {
      sourceChainId: this.chainId,
      providerUri: this.provider,
      version: "v2",
      mock: this.isMock ?? false,
    };
    const queryBuilderClient = new QueryBuilderClient(
      config,
      this.dataQuery.map((dq) => dq.subqueryData),
      this.computeQuery,
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

import { AxiomBaseCircuit } from "@axiom-crypto/circuit/dist/js/index";
import { AxiomV2Callback } from "@axiom-crypto/core";
import { buildSendQuery } from "../sendQuery";
import { AxiomV2CircuitCapacity, AxiomV2ClientOptions, AxiomV2SendQueryArgs } from "../types";

export class AxiomCircuit<T> extends AxiomBaseCircuit<T> {
  public computeQuery: any;
  public axiom: any;
  public dataQuery: any;

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
    // Initialize properties that were causing errors
    this.computeQuery = undefined;
    this.axiom = undefined;
    this.dataQuery = undefined;
  }

  async getSendQueryArgs(input: {
    callbackTarget: string;
    callbackExtraData: string;
    callerAddress: string;
    options: AxiomV2ClientOptions;
  }): Promise<AxiomV2SendQueryArgs> {
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

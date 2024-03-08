import { encodePacked } from "viem";
import { BroadcastModule } from "./broadcastModule";
import { BroadcastParams } from "../types";

export class OpStackBroadcastModule extends BroadcastModule {
  protected inputs: { [key: string]: string } = {};

  constructor(inputs: { [key: string]: string }) {
    if (inputs.gasLimit === undefined) {
      throw new Error("`gasLimit` is required");
    }
    super();
    this.inputs = inputs;
  }

  getBridgeMetadata(): string {
    return encodePacked(["uint32"], [this.inputs.gasLimit]);
  }
  
  getBridgePayment(): bigint {
    return 0n;
  }
}
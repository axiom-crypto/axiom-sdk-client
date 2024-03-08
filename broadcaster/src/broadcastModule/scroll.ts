import { encodePacked } from "viem";
import { BroadcastModule } from "./broadcastModule";

export class ScrollBroadcastModule extends BroadcastModule {
  protected inputs: { [key: string]: string } = {};

  constructor(inputs: { [key: string]: string }) {
    if (inputs.gasLimit === undefined) {
      throw new Error("`gasLimit` is required");
    }
    super();
    this.inputs = inputs;
  }

  getBridgeMetadata(): string {
    
    return encodePacked(["uint256"], [this.inputs.gasLimit]);
  }
  
  getBridgePayment(): bigint {
    // TODO: compute via https://docs.scroll.io/en/technology/bridge/cross-domain-messaging/#message-relay-fee
    return 0n;
  }
}
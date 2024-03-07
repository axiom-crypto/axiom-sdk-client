import { encodePacked } from "viem";
import { BroadcastModule } from "./broadcastModule";

export class ScrollBroadcastModule extends BroadcastModule {
    constructor() {
        super();
    }

    getBridgeMetadata(inputs: { [key: string]: string }): string {
      if (inputs.gasLimit === undefined) {
        throw new Error("`gasLimit` is required");
      }
      return encodePacked(["uint256"], [inputs.gasLimit]);
    }
    
    getBridgePayment(inputs: { [key: string]: string }): bigint {
      // TODO: compute via https://docs.scroll.io/en/technology/bridge/cross-domain-messaging/#message-relay-fee
      return 0n;
    }
}
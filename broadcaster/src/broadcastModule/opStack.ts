import { encodePacked } from "viem";
import { BroadcastModule } from "./broadcastModule";

export class OpStackBroadcastModule extends BroadcastModule {
    constructor() {
        super();
    }

    getBridgeMetadata(inputs: { [key: string]: string }): string {
      if (inputs.gasLimit === undefined) {
        throw new Error("`gasLimit` is required");
      }
      return encodePacked(["uint32"], [inputs.gasLimit]);
    }
    
    getBridgePayment(inputs: { [key: string]: string }): bigint {
      return 0n;
    }
}
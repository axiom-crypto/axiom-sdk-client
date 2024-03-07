import { encodePacked } from "viem";
import { BroadcastModule } from "./broadcastModule";

export class ArbitrumBroadcastModule extends BroadcastModule {
    constructor() {
        super();
    }

    getBridgeMetadata(inputs: { [key: string]: string }): string {
      if (
        inputs.maxSubmissionCost === undefined || 
        inputs.maxGas === undefined ||
        inputs.gasPriceBid === undefined
      ) {
        throw new Error("`maxSubmissionCost`, `maxGas`, and `gasPriceBid` are required");
      }
      return encodePacked(
        ["uint256", "uint256", "uint256"],
        [inputs.maxSubmissionCost, inputs.maxGas, inputs.gasPriceBid]
      );
    }
    
    getBridgePayment(inputs: { [key: string]: string }): bigint {
      return BigInt(inputs.maxSubmissionCost) + BigInt(inputs.maxGas) * BigInt(inputs.gasPriceBid);
    }
}
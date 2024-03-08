import { encodePacked } from "viem";
import { BroadcastModule } from "./broadcastModule";

export class ArbitrumBroadcastModule extends BroadcastModule {
  protected inputs: { [key: string]: string } = {};

  constructor(inputs: { [key: string]: string }) {
    if (
      inputs.maxSubmissionCost === undefined || 
      inputs.maxGas === undefined ||
      inputs.gasPriceBid === undefined
    ) {
      throw new Error("`maxSubmissionCost`, `maxGas`, and `gasPriceBid` are required");
    }
    super();
    this.inputs = inputs;
  }

  getBridgeMetadata(): string {
    return encodePacked(
      ["uint256", "uint256", "uint256"],
      [this.inputs.maxSubmissionCost, this.inputs.maxGas, this.inputs.gasPriceBid]
    );
  }
  
  getBridgePayment(): bigint {
    return BigInt(this.inputs.maxSubmissionCost) + BigInt(this.inputs.maxGas) * BigInt(this.inputs.gasPriceBid);
  }
}
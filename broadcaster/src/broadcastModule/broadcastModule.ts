import { BroadcastParams } from "../types";

export abstract class BroadcastModule {
  abstract getBridgeMetadata(): string;
  abstract getBridgePayment(): bigint;
  
  getBroadcastParams(): BroadcastParams {
    return {
      bridgeMetadata: this.getBridgeMetadata(),
      bridgePayment: this.getBridgePayment(),
    }
  }
}
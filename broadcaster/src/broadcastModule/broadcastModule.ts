export abstract class BroadcastModule {
  abstract getBridgeMetadata(inputs: { [key: string]: string }): string;
  abstract getBridgePayment(inputs: { [key: string]: string }): bigint;
}
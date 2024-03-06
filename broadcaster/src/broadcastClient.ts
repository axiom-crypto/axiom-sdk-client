import { createPublicClient, createWalletClient, defineChain, http } from "viem";
import { privateKeyToAccount } from 'viem/accounts';
import { AxiomV2BroadcastClientConfig, AxiomV2BroadcastClientParams, SourceTarget } from "./types";
import { createChain } from "./utils";

export class BroadcastClient {
  protected source: AxiomV2BroadcastClientParams;
  protected target: AxiomV2BroadcastClientParams;

  constructor(
    sourceConfig: AxiomV2BroadcastClientConfig,
    targetConfig: AxiomV2BroadcastClientConfig,
  ) {
    this.source = this.setupParams(sourceConfig);
    this.target = this.setupParams(targetConfig);
  }

  private setupParams = (
    params: AxiomV2BroadcastClientConfig
  ): AxiomV2BroadcastClientParams => {
    const chain = createChain(params.chainId, params.provider);
    const publicClient = createPublicClient({
      chain,
      transport: http(params.provider),
    });
    let walletClient;
    if (params.privateKey) {
      walletClient = createWalletClient({
        chain,
        account: privateKeyToAccount(params.privateKey as `0x${string}`),
        transport: http(params.provider),
      });
    }
    return {
      chainId: params.chainId,
      publicClient,
      walletClient,
    } as AxiomV2BroadcastClientParams;
  }

  
}
import { PublicClient, WalletClient } from "viem";

export interface SourceTarget {
  source: string;
  target: string;
}

export interface Channel {
  chainId: string;
  bridgeId: number;
}

export interface BroadcastParams {
  bridgeMetadata: string;
  bridgePayment: string;
}

export interface AxiomV2BroadcastClientConfig {
  chainId: string;
  provider: string;
  privateKey?: string;
}

export interface AxiomV2BroadcastClientParams {
  chainId: string;
  publicClient: PublicClient;
  walletClient: WalletClient;
}
import { PublicClient, WalletClient } from "viem";
import { ByteLengths } from "@axiom-crypto/core";

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
  walletClient: WalletClient | undefined;
}

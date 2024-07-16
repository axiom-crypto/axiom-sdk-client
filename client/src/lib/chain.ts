import { BaseDefaults, MainnetDefaults } from "./constants";
import { ChainDefaults } from "../types";

export function isMainnetChain(chainId: string) {
  switch (chainId) {
    case "1":  // Mainnet
    case "11155111":  // Sepolia
      return true;
    default:
      return false;
  }
}

export function isOptimismChain(chainId: string) {
  switch (chainId) {
    case "10":  // Optimism
    case "11155420":  // Optimism Sepolia
      return true;
    default:
      return false;
  }
}

export function isBaseChain(chainId: string) {
  switch (chainId) {
    case "8453":  // Base
    case "84532":  // Base Sepolia
      return true;
    default:
      return false;
  }
}

export function isOpStackChain(chainId: string) {
  if (isOptimismChain(chainId) || isBaseChain(chainId)) {
    return true;
  }
  return false;
}

export function isArbitrumChain(chainId: string) {
  switch (chainId) {
    case "42161": // Arbitrum
    case "421614":  // Arbitrum Sepolia
      return true;
    default:
      return false;
  }
}

export function isScrollChain(chainId: string) {
  switch (chainId) {
    case "534352":  // Scroll
    case "534351":  // Scroll Sepolia
      return true;
    default:
      return false;
  }
}

export function getChainDefaults(chainId: string): Readonly<ChainDefaults> {
  if (isMainnetChain(chainId)) {
    return MainnetDefaults;
  } else if (isBaseChain(chainId)) {
    return BaseDefaults;
  } else {
    console.warn(`Unsupported chain ${chainId}; using Mainnet defaults`);
    return MainnetDefaults;
  }
}

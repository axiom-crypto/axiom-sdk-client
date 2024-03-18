export function isMainnetChain(chainId: string) {
  switch (chainId) {
    case "1":  // Mainnet
    case "11155111":  // Sepolia
      return true;
    default:
      return false;
  }
}

export function isOpStackChain(chainId: string) {
  switch (chainId) {
    case "10":  // Optimism
    case "11155420":  // Optimism Sepolia
    case "8453":  // Base
    case "84532":  // Base Sepolia
      return true;
    default:
      return false;
  }
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
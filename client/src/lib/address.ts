import {
  arbitrum,
  arbitrumSepolia,
  base,
  baseSepolia,
  mainnet,
  optimism,
  optimismSepolia,
  scroll,
  scrollSepolia,
  sepolia
} from "viem/chains";

const axiomV2QueryAddresses = {
  [mainnet.id.toString()]: {
    [mainnet.id.toString()]: "0x83c8c0B395850bA55c830451Cfaca4F2A667a983",
    [arbitrum.id.toString()]: "",
    [optimism.id.toString()]: "",
    [base.id.toString()]: "",
    [scroll.id.toString()]: "",
  },
  [sepolia.id.toString()]: {
    [sepolia.id.toString()]: "",
    [arbitrumSepolia.id.toString()]: "",
    [optimismSepolia.id.toString()]: "",
    [baseSepolia.id.toString()]: "",
    [scrollSepolia.id.toString()]: "",
  },
};

const axiomV2QueryAddressesMock = {
  [mainnet.id.toString()]: {
    [mainnet.id.toString()]: "",
    [arbitrum.id.toString()]: "",
    [optimism.id.toString()]: "",
    [base.id.toString()]: "",
    [scroll.id.toString()]: "",
  },
  [sepolia.id.toString()]: {
    [sepolia.id.toString()]: "0x83c8c0B395850bA55c830451Cfaca4F2A667a983",
    [arbitrumSepolia.id.toString()]: "",
    [optimismSepolia.id.toString()]: "",
    [baseSepolia.id.toString()]: "",
    [scrollSepolia.id.toString()]: "",
  },
};

export function getContractAddress(
  chainId: string,
  targetChainId?: string,
  bridgeId?: number,
  mock?: boolean,
) {
  if (mock === undefined) {
    mock = false;
  }
  if (targetChainId === undefined || targetChainId === chainId) {
    if (!mock) {
      switch (chainId) {
        case mainnet.id.toString():
          return axiomV2QueryAddresses[mainnet.id.toString()][mainnet.id.toString()];
        case sepolia.id.toString():
          return axiomV2QueryAddresses[sepolia.id.toString()][sepolia.id.toString()];
        default:
          throw new Error(`Chain ${chainId} not supported`);
      }
    } else {
      switch (chainId) {
        case mainnet.id.toString():
          return axiomV2QueryAddressesMock[mainnet.id.toString()][mainnet.id.toString()];
        case sepolia.id.toString():
          return axiomV2QueryAddressesMock[sepolia.id.toString()][sepolia.id.toString()];
        default:
          throw new Error(`Chain ${chainId} not supported`);
      }
    }
  }

  if (bridgeId === undefined) {
    bridgeId = 0;
  }

  switch (chainId) {
    case "1":
      switch (targetChainId) {
        case "":
      }
  }
  
}
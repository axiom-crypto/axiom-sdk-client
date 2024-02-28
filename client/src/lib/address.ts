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

const axiomV2BridgeAddress = {
  [mainnet.id.toString()]: {
    [arbitrum.id.toString()]: [
      "",
    ],
    [optimism.id.toString()]: [
      "",
    ],
    [base.id.toString()]: [
      "",
    ],
    [scroll.id.toString()]: [
      "",
    ],
  },
}

export function getAxiomV2QueryAddress(
  chainId: string,
  targetChainId?: string,
  mock?: boolean,
) {
  if (mock === undefined) {
    mock = false;
  }

  if (targetChainId === undefined) {
    targetChainId = chainId;
  }
  
  if (!mock) {
    return axiomV2QueryAddresses[chainId][targetChainId];
  } else {
    return axiomV2QueryAddressesMock[chainId][targetChainId];
  }
}

export function getAxiomV2BridgeAddress(
  chainId: string,
  targetChainId: string,
  bridgeId?: number,
) {
  if (bridgeId === undefined) {
    bridgeId = 0;
  }

  return axiomV2BridgeAddress[chainId][targetChainId][bridgeId];
}
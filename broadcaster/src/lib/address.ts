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

const axiomV2BroadcasterAddresses = {
  [mainnet.id.toString()]: "",
  [sepolia.id.toString()]: "0xD95c6Ca1fdB559A3108617BD0Ac846b8CCD871E3",
}

// Maps sourceChainId to targetChainId to bridge ID addresses
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

export function getAxiomV2BroadcasterAddress(chainId: string) {
  return axiomV2BroadcasterAddresses[chainId];
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

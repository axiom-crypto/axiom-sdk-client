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

// Maps sourceChainId to targetChainId AxiomV2Query deployment address
const axiomV2QueryAddresses = {
  [mainnet.id.toString()]: {
    [mainnet.id.toString()]: "0x83c8c0B395850bA55c830451Cfaca4F2A667a983",
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
  [base.id.toString()]: {
    [mainnet.id.toString()]: "",
    [arbitrum.id.toString()]: "",
    [optimism.id.toString()]: "",
    [base.id.toString()]: "",
    [scroll.id.toString()]: "",
  },
  [baseSepolia.id.toString()]: {
    [sepolia.id.toString()]: "",
    [arbitrumSepolia.id.toString()]: "",
    [optimismSepolia.id.toString()]: "",
    [baseSepolia.id.toString()]: "0xd142AC39325Fc96F2252ee163c3087F7099a5B69",
    [scrollSepolia.id.toString()]: "",
  },
};

export function getAxiomV2QueryAddress(
  chainId: string,
  targetChainId?: string,
) {
  if (targetChainId === undefined) {
    targetChainId = chainId;
  }
  return axiomV2QueryAddresses?.[chainId]?.[targetChainId] ?? "";
}

export function getOpStackL1BlockAttributesAddress() {
  // return "0x420000000000000000000000000000000000000F";
  return "0x4200000000000000000000000000000000000015";
}
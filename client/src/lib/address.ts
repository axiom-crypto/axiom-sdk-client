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
  [mainnet.id.toString()]: "0x83c8c0B395850bA55c830451Cfaca4F2A667a983",
  [sepolia.id.toString()]: "0x83c8c0B395850bA55c830451Cfaca4F2A667a983",
  [base.id.toString()]: "0xfe059442B0379D5f22Bec384A588766f98A36812",
  [baseSepolia.id.toString()]: "0xfe059442B0379D5f22Bec384A588766f98A36812",
};

const axiomV2QueryBlockhashOracleAddresses = {
  [mainnet.id.toString()]: {
    [optimism.id.toString()]: undefined,
    [base.id.toString()]: undefined,
  },
  [sepolia.id.toString()]: {
    [optimismSepolia.id.toString()]: undefined,
    [baseSepolia.id.toString()]: "0xdEaDBEefDeaDbEefDeAdbeefDeAdbEEfAAaaAAaA",
  },
};

const axiomV2QueryBroadcasterAddresses = {
  [mainnet.id.toString()]: {
    [base.id.toString()]: [],
    [scroll.id.toString()]: [],
  },
  [sepolia.id.toString()]: {
    [arbitrumSepolia.id.toString()]: [],
    [scrollSepolia.id.toString()]: [],
  },
};

export function getAxiomV2QueryAddress(
  chainId: string,
) {
  const address = axiomV2QueryAddresses[chainId];
  if (!address) {
    throw new Error(`AxiomV2Query address not found for chainId: ${chainId}`);
  }
  return address;
}

export function getAxiomV2QueryBlockhashOracleAddress(
  sourceChainId: string,
  targetChainId: string,
) {
  const address = axiomV2QueryBlockhashOracleAddresses?.[sourceChainId]?.[targetChainId];
  if (!address) {
    throw new Error(`AxiomV2BlockhashOracle address not found for sourceChainId: ${sourceChainId}, targetChainId: ${targetChainId}`);
  }
  return address;
}

export function getAxiomV2QueryBroadcasterAddress(
  sourceChainId: string,
  targetChainId: string,
  bridgeId: number,
) {
  const address = axiomV2QueryBroadcasterAddresses?.[sourceChainId]?.[targetChainId]?.[bridgeId];
  if (!address) {
    throw new Error(`AxiomV2QueryBroadcaster address not found for sourceChainId: ${sourceChainId}, targetChainId: ${targetChainId}, bridgeId: ${bridgeId}`);
  }
  return address;
}

export function getOpStackL1BlockAttributesAddress() {
  return "0x4200000000000000000000000000000000000015";
}

export function getOpStackGasPriceOracleAddress() {
  return "0x420000000000000000000000000000000000000F";
}
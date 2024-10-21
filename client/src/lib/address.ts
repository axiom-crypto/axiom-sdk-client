import {
  mainnet,
  sepolia
} from "viem/chains";

const axiomV2QueryAddresses = {
  [mainnet.id.toString()]: "0x83c8c0B395850bA55c830451Cfaca4F2A667a983",
  [sepolia.id.toString()]: "0x83c8c0B395850bA55c830451Cfaca4F2A667a983",
};

// TargetChainId -> SourceChainId
const axiomV2QueryBlockhashOracleAddresses: Record<string, Record<string, undefined>> = {};

// TargetChainId -> SourceChainId -> BridgeId
const axiomV2QueryBroadcasterAddresses: Record<string, Record<string, Array<string>>> = {};

export function getAxiomV2QueryAddress(chainId: string) {
  const address = axiomV2QueryAddresses[chainId];
  if (!address) {
    throw new Error(`AxiomV2Query address not found for chainId: ${chainId}`);
  }
  return address;
}

export function getAxiomV2QueryBlockhashOracleAddress(input: {
  targetChainId: string,
  sourceChainId: string,
}) {
  const address = axiomV2QueryBlockhashOracleAddresses?.[input.targetChainId]?.[input.sourceChainId];
  if (!address) {
    throw new Error(`AxiomV2BlockhashOracle address not found for targetChainId: ${input.targetChainId}, sourceChainId: ${input.sourceChainId}`);
  }
  return address;
}

export function getAxiomV2QueryBroadcasterAddress(input: {
  targetChainId: string;
  sourceChainId: string;
  bridgeId: number;
}) {
  const address = axiomV2QueryBroadcasterAddresses?.[input.targetChainId]?.[input.sourceChainId]?.[input.bridgeId];
  if (!address) {
    throw new Error(`AxiomV2QueryBroadcaster address not found for targetChainId: ${input.targetChainId}, sourceChainId: ${input.sourceChainId}, bridgeId: ${input.bridgeId}`);
  }
  return address;
}

export function getOpStackL1BlockAttributesAddress() {
  return "0x4200000000000000000000000000000000000015";
}

export function getOpStackGasPriceOracleAddress() {
  return "0x420000000000000000000000000000000000000F";
}
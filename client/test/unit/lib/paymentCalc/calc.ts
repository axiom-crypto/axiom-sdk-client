import { getChainDefaults } from "../../../../src/lib/chain";
import { ClientConstants } from "../../../../src/lib/constants";

export const calculateOpStackCallbackCost = (
  basefee: bigint,
  baseFeeScalar: bigint,
  blobBaseFee: bigint,
  blobBaseFeeScalar: bigint,
  maxFeePerGas: bigint,
  callbackGasLimit: bigint,
  proofVerificationGas: bigint
) => {
  return maxFeePerGas * (callbackGasLimit + proofVerificationGas) + 
    BigInt(ClientConstants.AXIOM_PROOF_CALLDATA_LEN) * 
    (16n * baseFeeScalar * basefee + blobBaseFeeScalar * blobBaseFee)  * 
    BigInt(ClientConstants.L1_FEE_NUMERATOR) / BigInt(ClientConstants.L1_FEE_DENOMINATOR) / BigInt(1e6);
}

export const calculateQueryCost = (
  chainId: string,
  basefee: bigint,
  baseFeeScalar: bigint,
  blobBaseFee: bigint,
  blobBaseFeeScalar: bigint,
  maxFeePerGas: bigint,
  callbackGasLimit: bigint,
  proofVerificationGas: bigint
): bigint => {
  const sdkMinMaxFeePerGas = getChainDefaults(chainId).minMaxFeePerGasWei;
  if (maxFeePerGas < sdkMinMaxFeePerGas) {
    maxFeePerGas = sdkMinMaxFeePerGas;
  }
  const projectedCallbackCost = calculateOpStackCallbackCost(basefee, baseFeeScalar, blobBaseFee, blobBaseFeeScalar, maxFeePerGas, callbackGasLimit, proofVerificationGas);
  const overrideAxiomQueryFee = getChainDefaults(chainId).axiomQueryFeeWei + projectedCallbackCost - maxFeePerGas * (callbackGasLimit + proofVerificationGas);
  const queryCost = overrideAxiomQueryFee + maxFeePerGas * (callbackGasLimit + proofVerificationGas);
  return queryCost;
}

export const percentDiffX100 = (a: bigint, b: bigint): bigint => {
  let percentDiff = (a - b) * 10000n / a;
  if (percentDiff < 0) {
    percentDiff = -percentDiff;
  }
  return percentDiff;
}

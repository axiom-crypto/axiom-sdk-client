import { ClientConstants } from "../constants";
import { AbiType, AxiomV2ClientOverrides, AxiomV2ClientOptions } from "../types";
import { PublicClient } from "viem";
import { getAxiomV2QueryAddress, getOptimismL1BlockAttributesAddress } from "./address";
import { getAxiomV2Abi, getOptimismL1BlockAttributesAbi } from "./abi";
import { isArbitrumChain, isMainnetChain, isOpStackChain, isScrollChain } from "./chain";

export async function calculatePayment(
  chainId: string,
  publicClient: PublicClient,
  options?: AxiomV2ClientOptions,
): Promise<bigint> {
  const axiomV2QueryAddr = options?.overrides?.queryAddress ?? getAxiomV2QueryAddress(chainId);

  // Convert callback gas limit to wei
  const callbackGasLimit = BigInt(options?.callbackGasLimit ?? ClientConstants.DEFAULT_CALLBACK_GAS_LIMIT);

  // Get maxFeePerGas
  const maxFeePerGas = BigInt(options?.maxFeePerGas ?? ClientConstants.DEFAULT_MAX_FEE_PER_GAS_WEI);

  // Get proofVerificationGas from contract
  const proofVerificationGas = await getAxiomV2QueryValue(
    publicClient,
    axiomV2QueryAddr,
    "proofVerificationGas",
    [],
    ClientConstants.FALLBACK_PROOF_VERIFICATION_GAS
  );

  // Get axiomQueryFee from contract if on ethereum, otherwise use L2 equation
  let axiomQueryFee;
  if (isMainnetChain(chainId)) {
    axiomQueryFee = await getAxiomV2QueryValue(
      publicClient,
      axiomV2QueryAddr,
      "axiomQueryFee",
      [],
      ClientConstants.FALLBACK_AXIOM_QUERY_FEE_WEI
    );
  } else {
    // overrideAxiomQueryFee = AXIOM_QUERY_FEE + projectedCallbackCost - maxFeePerGas * (callbackGasLimit + proofVerificationGas)
    axiomQueryFee = ClientConstants.FALLBACK_AXIOM_QUERY_FEE_WEI + 
      await getProjectedCallbackCost(chainId, publicClient, maxFeePerGas, callbackGasLimit, proofVerificationGas) - 
      maxFeePerGas * (callbackGasLimit + proofVerificationGas);
  }
  
  // Check if the override value, if set, is greater than the contract/default value and write it if so
  if (options?.overrideAxiomQueryFee !== undefined && BigInt(options.overrideAxiomQueryFee) > axiomQueryFee) {
    axiomQueryFee = BigInt(options.overrideAxiomQueryFee);
  }

  // Calculate payment
  let payment = axiomQueryFee + maxFeePerGas * (proofVerificationGas + callbackGasLimit);

  const minimumPayment = await getProjectedCallbackCost(chainId, publicClient, maxFeePerGas, callbackGasLimit, proofVerificationGas) + 
    ClientConstants.FALLBACK_AXIOM_QUERY_FEE_WEI;

  if (payment < minimumPayment) {
    payment = minimumPayment;
  }

  return payment;
}

export async function getProjectedCallbackCost(
  chainId: string,
  publicClient: PublicClient,
  maxFeePerGas: bigint,
  callbackGasLimit: bigint,
  proofVerificationGas: bigint,
): Promise<bigint> {
  if (isMainnetChain(chainId)) {
    return 0n;
  } else if (isOpStackChain(chainId)) {
    // on OP Stack
    // projectedCallbackCost = 
    //   maxFeePerGas * (callbackGasLimit + proofVerificationGas) +    
    //   AXIOM_PROOF_CALLDATA_BYTES * 16 * (L1BlockAttributes.baseFeeScalar * L1BlockAttributes.basefee + 
    //   L1BlockAttributes.blogBaseFeeScalar / 16 * L1BlockAttributes.blobBaseFee) 
    const baseFeeScalar = await getOptimismL1Value(publicClient, "baseFeeScalar", []);
    const baseFee = await getOptimismL1Value(publicClient, "basefee", []);
    const blobBaseFeeScalar = await getOptimismL1Value(publicClient, "blobBaseFeeScalar", []);
    const blobBaseFee = await getOptimismL1Value(publicClient, "blobBaseFee", []);
    console.log(baseFeeScalar, baseFee, blobBaseFeeScalar, blobBaseFee);
    return maxFeePerGas * (callbackGasLimit + proofVerificationGas) + 
      BigInt(ClientConstants.AXIOM_PROOF_CALLDATA_BYTES) * 16n * 
      (baseFeeScalar * baseFee + blobBaseFeeScalar / 16n * blobBaseFee);
  } else if (isArbitrumChain(chainId)) {
    // on Arbitrum
    // projectedCallbackCost = 
    //   maxFeePerGas * (callbackGasLimit + proofVerificationGas) +
    //   AXIOM_PROOF_CALLDATA_BYTES * 16 * ArbGasInfo.getL1BaseFeeEstimate()
    return 0n; // WIP
  } else if (isScrollChain(chainId)) {
    // on Scroll
    // projectedCallbackCost = 
    //   maxFeePerGas * (callbackGasLimit + proofVerificationGas) +   
    //   AXIOM_PROOF_CALLDATA_BYTES * 16 * L1GasPriceOracle.l1BaseFee()
    return 0n; // WIP
  } else {    
    return 0n;
  }
}

export async function getAxiomBalance(
  publicClient: PublicClient,
  chainId: string,
  userAddress: string,
  overrides?: AxiomV2ClientOverrides,
): Promise<string> {
  const axiomQueryAddress = overrides?.queryAddress ?? getAxiomV2QueryAddress(chainId);
  const balance = await publicClient.readContract({
    address: axiomQueryAddress as `0x${string}`,
    abi: getAxiomV2Abi(AbiType.Query),
    functionName: "balances",
    args: [userAddress],
  });
  return balance.toString();
}

async function getAxiomV2QueryValue(
  publicClient: PublicClient,
  axiomV2QueryAddr: string,
  functionName: string,
  args: any[],
  fallback: bigint,
): Promise<bigint> {
  let value;
  try {
    value = BigInt(await publicClient.readContract({
      address: axiomV2QueryAddr as `0x${string}`,
      abi: getAxiomV2Abi(AbiType.Query),
      functionName,
      args,
    }));
  } catch (e: any) {
    console.log(`Unable to read ${functionName} from contract ${axiomV2QueryAddr}`);
  }
  value = BigInt(value ?? 0);
  if (value === 0n) {
    value = fallback;
  }
  return value;
}

async function getOptimismL1Value(
  publicClient: PublicClient,
  functionName: string,
  args: any[],
): Promise<bigint> {
  return BigInt(await publicClient.readContract({
    address: getOptimismL1BlockAttributesAddress() as `0x${string}`,
    abi: getOptimismL1BlockAttributesAbi(),
    functionName,
    args,
  })); // in wei
}
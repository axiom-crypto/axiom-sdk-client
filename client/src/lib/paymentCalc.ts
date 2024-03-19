import { ClientConstants } from "../constants";
import { AbiType, AxiomV2ClientOverrides, AxiomV2ClientOptions } from "../types";
import { PublicClient } from "viem";
import { getAxiomV2QueryAddress, getOpStackGasPriceOracleAddress } from "./address";
import { getAxiomV2Abi, getOpStackGasPriceOracleAbi } from "./abi";
import { isArbitrumChain, isOpStackChain, isScrollChain } from "./chain";
import { publicActionsL2 } from 'viem/op-stack';
import { readContractValue } from "./viem";

export async function calculatePayment(
  chainId: string,
  publicClient: PublicClient,
  options: AxiomV2ClientOptions,
): Promise<bigint> {
  const axiomV2QueryAddr = options.overrides?.queryAddress ?? getAxiomV2QueryAddress(chainId);

  // Get callback gas limit
  const callbackGasLimit = BigInt(options.callbackGasLimit ?? ClientConstants.DEFAULT_CALLBACK_GAS_LIMIT);

  // Get maxFeePerGas
  const maxFeePerGas = BigInt(options.maxFeePerGas ?? ClientConstants.DEFAULT_MAX_FEE_PER_GAS_WEI);

  // Get proofVerificationGas from contract
  const proofVerificationGas = await readContractValue(
    publicClient,
    axiomV2QueryAddr,
    getAxiomV2Abi(AbiType.Query),
    "proofVerificationGas",
    [],
    ClientConstants.FALLBACK_PROOF_VERIFICATION_GAS
  );

  // Get axiomQueryFee from contract
  let axiomQueryFee = await readContractValue(
    publicClient,
    axiomV2QueryAddr,
    getAxiomV2Abi(AbiType.Query),
    "axiomQueryFee",
    [],
    ClientConstants.FALLBACK_AXIOM_QUERY_FEE_WEI
  );

  if (isOpStackChain(chainId) || isArbitrumChain(chainId) || isScrollChain(chainId)) {
    // Get the projected callback cost
    const projectedCallbackCost = await getProjectedL2CallbackCost(chainId, publicClient, maxFeePerGas, callbackGasLimit, proofVerificationGas);

    // Get overrideAxiomQueryFee from either equation or options
    let overrideAxiomQueryFee: bigint;
    if (options.overrideAxiomQueryFee !== undefined) {
      overrideAxiomQueryFee = BigInt(options.overrideAxiomQueryFee);
    } else {
      // overrideAxiomQueryFee = AXIOM_QUERY_FEE + projectedCallbackCost - maxFeePerGas * (callbackGasLimit + proofVerificationGas)
      overrideAxiomQueryFee = ClientConstants.FALLBACK_AXIOM_QUERY_FEE_WEI + 
        projectedCallbackCost - maxFeePerGas * (callbackGasLimit + proofVerificationGas);
    }

    // max(overrideAxiomQueryFee, axiomQueryFee)
    if (overrideAxiomQueryFee > axiomQueryFee) {
      axiomQueryFee = overrideAxiomQueryFee;
    }

    // Calculate payment
    let payment = axiomQueryFee + maxFeePerGas * (proofVerificationGas + callbackGasLimit);
    const minimumPayment = projectedCallbackCost + ClientConstants.FALLBACK_AXIOM_QUERY_FEE_WEI;
    if (payment < minimumPayment) {
      throw new Error(`Payment ${payment} is less than minimum payment ${minimumPayment}`);
    }
    return payment;
  } else {
    if (options.overrideAxiomQueryFee !== undefined && BigInt(options.overrideAxiomQueryFee) > axiomQueryFee) {
      axiomQueryFee = BigInt(options.overrideAxiomQueryFee);
    }
    return axiomQueryFee + maxFeePerGas * (proofVerificationGas + callbackGasLimit);
  }
}

export async function getProjectedL2CallbackCost(
  chainId: string,
  publicClient: PublicClient,
  maxFeePerGas: bigint,
  callbackGasLimit: bigint,
  proofVerificationGas: bigint,
): Promise<bigint> {
  if (isOpStackChain(chainId)) {
    // on OP Stack
    // projectedCallbackCost = 
    //   maxFeePerGas * (callbackGasLimit + proofVerificationGas) +    
    //   AXIOM_PROOF_CALLDATA_LEN * 16 * (L1BlockAttributes.baseFeeScalar * L1BlockAttributes.basefee + 
    //   L1BlockAttributes.blobBaseFeeScalar / 16 * L1BlockAttributes.blobBaseFee) / 1e6
    const l1Fee = await readContractValue(
      publicClient.extend(publicActionsL2()),
      getOpStackGasPriceOracleAddress() as `0x${string}`,
      getOpStackGasPriceOracleAbi(),
      "getL1Fee",
      [ClientConstants.AXIOM_PROOF_CALLDATA_BYTES],
    );
    return maxFeePerGas * (callbackGasLimit + proofVerificationGas) + l1Fee;
  } else if (isArbitrumChain(chainId)) {
    // on Arbitrum
    // projectedCallbackCost = 
    //   maxFeePerGas * (callbackGasLimit + proofVerificationGas) +
    //   AXIOM_PROOF_CALLDATA_LEN * 16 * ArbGasInfo.getL1BaseFeeEstimate()
    throw new Error("Arbitrum not yet supported");
  } else if (isScrollChain(chainId)) {
    // on Scroll
    // projectedCallbackCost = 
    //   maxFeePerGas * (callbackGasLimit + proofVerificationGas) +   
    //   AXIOM_PROOF_CALLDATA_LEN * 16 * L1GasPriceOracle.l1BaseFee()
    throw new Error("Scroll not yet supported");
  } else {    
    throw new Error(`Unsupported chain ${chainId}`);
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

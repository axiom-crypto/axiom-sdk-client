import { ClientConstants } from "../constants";
import { AbiType, AxiomV2ClientOverrides, AxiomV2ClientOptions, AxiomV2FeeDataExtended } from "../types";
import { PublicClient } from "viem";
import { getAxiomV2QueryAddress, getOpStackGasPriceOracleAddress } from "./address";
import { getAxiomV2Abi, getOpStackGasPriceOracleAbi } from "./abi";
import { getChainDefaults, isArbitrumChain, isMainnetChain, isOpStackChain, isScrollChain } from "./chain";
import { publicActionsL2 } from 'viem/op-stack';
import { readContractValueBigInt } from "./viem";

export async function calculatePayment(
  chainId: string,
  publicClient: PublicClient,
  feeData: AxiomV2FeeDataExtended,
): Promise<bigint> {
  const defaults = getChainDefaults(chainId);
  const payment = BigInt(feeData.overrideAxiomQueryFee) + BigInt(feeData.maxFeePerGas) * 
      (BigInt(feeData.callbackGasLimit) + feeData.proofVerificationGas);

  if (isMainnetChain(chainId)) {
    return payment;
  } else if (isOpStackChain(chainId) || isArbitrumChain(chainId) || isScrollChain(chainId)) {
    // Get the projected callback cost
    const projectedCallbackCost = await getProjectedL2CallbackCost(
      chainId, publicClient,
      BigInt(feeData.maxFeePerGas),
      BigInt(feeData.callbackGasLimit),
      feeData.proofVerificationGas
    );
    const minimumPayment = projectedCallbackCost + defaults.axiomQueryFeeWei;
    if (payment < minimumPayment) {
      throw new Error(`Payment ${payment} is less than minimum payment ${minimumPayment}`);
    }
    return payment;
  } else {
    throw new Error(`Unsupported chain ${chainId}`);
  }
}

export async function calculateFeeDataExtended(
  chainId: string,
  publicClient: PublicClient,
  options: AxiomV2ClientOptions,
): Promise<AxiomV2FeeDataExtended> {
  const axiomV2QueryAddr = options.overrides?.queryAddress ?? getAxiomV2QueryAddress(chainId);
  const defaults = getChainDefaults(chainId);

  // Get callback gas limit
  const callbackGasLimit = BigInt(options.callbackGasLimit ?? defaults.callbackGasLimit);

  // Get maxFeePerGas and set to SDK default's minMaxFeePerGasWei if less this value
  let maxFeePerGas = BigInt(options.maxFeePerGas ?? defaults.maxFeePerGasWei);
  if (maxFeePerGas < defaults.minMaxFeePerGasWei) {
    maxFeePerGas = defaults.minMaxFeePerGasWei;
  }

  // Get proofVerificationGas from contract
  const proofVerificationGas = await readContractValueBigInt(
    publicClient,
    axiomV2QueryAddr,
    getAxiomV2Abi(AbiType.Query),
    "proofVerificationGas",
    [],
    defaults.proofVerificationGas
  );

  // Get axiomQueryFee from contract
  const axiomQueryFee = await readContractValueBigInt(
    publicClient,
    axiomV2QueryAddr,
    getAxiomV2Abi(AbiType.Query),
    "axiomQueryFee",
    [],
    defaults.axiomQueryFeeWei
  );

  let overrideAxiomQueryFee = BigInt(options.overrideAxiomQueryFee ?? "0");
  if (axiomQueryFee > overrideAxiomQueryFee) {
    overrideAxiomQueryFee = axiomQueryFee;
  }

  if (isMainnetChain(chainId)) { 
    return {
      maxFeePerGas: maxFeePerGas.toString(),
      callbackGasLimit: Number(callbackGasLimit),
      overrideAxiomQueryFee: overrideAxiomQueryFee.toString(),
      proofVerificationGas,
    };
  } else if (isOpStackChain(chainId) || isArbitrumChain(chainId) || isScrollChain(chainId)) {
    // Get the projected callback cost
    const projectedCallbackCost = await getProjectedL2CallbackCost(chainId, publicClient, maxFeePerGas, callbackGasLimit, proofVerificationGas);

    // overrideAxiomQueryFeeL2 = AXIOM_QUERY_FEE + projectedCallbackCost - maxFeePerGas * (callbackGasLimit + proofVerificationGas)
    const overrideAxiomQueryFeeL2 = axiomQueryFee + projectedCallbackCost - maxFeePerGas * (callbackGasLimit + proofVerificationGas);
    if (overrideAxiomQueryFeeL2 > overrideAxiomQueryFee) {
      overrideAxiomQueryFee = overrideAxiomQueryFeeL2;
    }
    
    return {
      maxFeePerGas: maxFeePerGas.toString(),
      callbackGasLimit: Number(callbackGasLimit),
      overrideAxiomQueryFee: overrideAxiomQueryFee.toString(),
      proofVerificationGas,
    };
  } else {
    throw new Error(`Unsupported chain ${chainId}`);
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
    //   opStackGasOracle.getL1Fee(AXIOM_PROOF_CALLDATA_BYTES)
    const l1Fee = await readContractValueBigInt(
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

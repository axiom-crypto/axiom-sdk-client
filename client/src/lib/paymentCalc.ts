import { ClientConstants } from "./constants";
import { AbiType, AxiomV2ClientOverrides, AxiomV2QueryOptions, AxiomV2FeeDataExtended } from "../types";
import { PublicClient } from "viem";
import { getAxiomV2QueryAddress, getOpStackGasPriceOracleAddress } from "./address";
import { getAxiomV2Abi, getOpStackGasPriceOracleAbi } from "./abi";
import { getChainDefaults, isArbitrumChain, isMainnetChain, isOpStackChain, isScrollChain } from "./chain";
import { publicActionsL2 } from 'viem/op-stack';
import { readContractValueBigInt } from "./viem";

/**
 * Calculate the payment amount (in wei) for axiom query.
 * @param chainId The chain ID that we are using
 * @param publicClient The viem PublicClient instance
 * @param feeData Fee data calculated from `calculateFeeDataExtended` function
 * @returns Payment amount in wei
 */
export async function calculatePayment(
  chainId: string,
  publicClient: PublicClient,
  feeData: AxiomV2FeeDataExtended,
): Promise<bigint> {
  const defaults = getChainDefaults(chainId);

  const queryFee = feeData.overrideAxiomQueryFee === "0" ? BigInt(feeData.axiomQueryFee) : BigInt(feeData.overrideAxiomQueryFee);

  const payment = queryFee + BigInt(feeData.maxFeePerGas) * 
      (BigInt(feeData.callbackGasLimit) + feeData.proofVerificationGas);

  // Handle supported L2s
  if (isOpStackChain(chainId) || isArbitrumChain(chainId) || isScrollChain(chainId)) {
    // Get the raw projected callback cost
    const projectedCallbackCost = await getProjectedL2CallbackCost(
      chainId,
      publicClient,
      BigInt(feeData.maxFeePerGas),
      BigInt(feeData.callbackGasLimit),
      feeData.proofVerificationGas,
    );
    const minimumPayment = projectedCallbackCost + defaults.axiomQueryFeeWei;
    if (payment < minimumPayment) {
      console.warn(`Payment ${payment} is less than minimum payment ${minimumPayment}`);
    }
  }

  // Mainnet or other chain
  return payment;
}

/**
 * Calculate the fee data for axiom query.
 * @param chainId The chain ID that we are using
 * @param publicClient The viem PublicClient instance
 * @param options The AxiomV2 client options object
 * @returns AxiomV2FeeDataExtended struct
 */
export async function calculateFeeDataExtended(
  chainId: string,
  publicClient: PublicClient,
  axiomQueryAddress: string,
  options: AxiomV2QueryOptions,
): Promise<AxiomV2FeeDataExtended> {
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
    axiomQueryAddress,
    getAxiomV2Abi(AbiType.Query),
    "proofVerificationGas",
    [],
    defaults.proofVerificationGas
  );

  // Get axiomQueryFee from contract
  const axiomQueryFee = await readContractValueBigInt(
    publicClient,
    axiomQueryAddress,
    getAxiomV2Abi(AbiType.Query),
    "axiomQueryFee",
    [],
    defaults.axiomQueryFeeWei
  );

  let overrideAxiomQueryFee = BigInt(options.overrideAxiomQueryFee ?? "0");

  if (isMainnetChain(chainId)) { 
    if (overrideAxiomQueryFee !== 0n && axiomQueryFee > overrideAxiomQueryFee) {
      overrideAxiomQueryFee = axiomQueryFee;
    } 
  } else if (isOpStackChain(chainId) || isArbitrumChain(chainId) || isScrollChain(chainId)) {
    const defaultAxiomQueryFee = getChainDefaults(chainId).axiomQueryFeeWei;

    // Get the projected callback cost multiplied by a predefined factor
    const projectedCallbackCost = await getProjectedL2CallbackCost(
      chainId,
      publicClient,
      maxFeePerGas,
      callbackGasLimit,
      proofVerificationGas,
      ClientConstants.L1_FEE_NUMERATOR,
      ClientConstants.L1_FEE_DENOMINATOR,
    );

    // overrideAxiomQueryFeeL2 = AXIOM_QUERY_FEE + projectedCallbackCost - maxFeePerGas * (callbackGasLimit + proofVerificationGas)
    // overrideAxiomQueryFeeL2 = AXIOM_QUERY_FEE + paddedL1Fee
    const overrideAxiomQueryFeeL2 = defaultAxiomQueryFee + projectedCallbackCost - maxFeePerGas * (callbackGasLimit + proofVerificationGas);
    
    // overrideAxiomQueryFee = max(overrideAxiomQueryFeeL2, overrideAxiomQueryFee, AXIOM_QUERY_FEE)
    const largerAxiomQueryFee = overrideAxiomQueryFeeL2 > axiomQueryFee ? overrideAxiomQueryFeeL2 : defaultAxiomQueryFee;
    overrideAxiomQueryFee = overrideAxiomQueryFee > largerAxiomQueryFee ? overrideAxiomQueryFee : largerAxiomQueryFee;
  } else {
    console.warn(`Unsupported chain ${chainId}`);
  }
  
  return {
    maxFeePerGas: maxFeePerGas.toString(),
    callbackGasLimit: Number(callbackGasLimit),
    overrideAxiomQueryFee: overrideAxiomQueryFee.toString(),
    axiomQueryFee,
    proofVerificationGas,
  };
}

export async function getProjectedL2CallbackCost(
  chainId: string,
  publicClient: PublicClient,
  maxFeePerGas: bigint,
  callbackGasLimit: bigint,
  proofVerificationGas: bigint,
  l1FeeMultiplierNumerator?: bigint,
  l1FeeMultiplierDenominator?: bigint,
): Promise<bigint> {
  if (isOpStackChain(chainId)) {
    // on OP Stack
    // projectedCallbackCost = 
    //   maxFeePerGas * (callbackGasLimit + proofVerificationGas) +
    //   opStackGasOracle.getL1Fee(AXIOM_PROOF_CALLDATA_BYTES)
    const gasUsed = maxFeePerGas * (callbackGasLimit + proofVerificationGas);
    const l1Fee = await readContractValueBigInt(
      publicClient.extend(publicActionsL2()),
      getOpStackGasPriceOracleAddress() as `0x${string}`,
      getOpStackGasPriceOracleAbi(),
      "getL1Fee",
      [ClientConstants.AXIOM_PROOF_CALLDATA_BYTES],
    );
    if (l1FeeMultiplierNumerator || l1FeeMultiplierDenominator) {
      if (!(l1FeeMultiplierNumerator && l1FeeMultiplierDenominator)) {
        throw new Error("l1FeeMultiplierNumerator and l1FeeMultiplierDenominator must be both set or both unset");
      }
      const paddedL1Fee = l1Fee * l1FeeMultiplierNumerator / l1FeeMultiplierDenominator;
      return gasUsed + paddedL1Fee;
    }
    return gasUsed + l1Fee;
  } else if (isArbitrumChain(chainId)) {
    // on Arbitrum
    // projectedCallbackCost = 
    //   maxFeePerGas * (callbackGasLimit + proofVerificationGas) +
    //   AXIOM_PROOF_CALLDATA_LEN * 16 * ArbGasInfo.getL1BaseFeeEstimate()
    console.warn("Arbitrum not yet supported");
    return 0n;
  } else if (isScrollChain(chainId)) {
    // on Scroll
    // projectedCallbackCost = 
    //   maxFeePerGas * (callbackGasLimit + proofVerificationGas) +   
    //   AXIOM_PROOF_CALLDATA_LEN * 16 * L1GasPriceOracle.l1BaseFee()
    console.warn("Scroll not yet supported");
    return 0n;
  } else {    
    console.warn(`Unsupported chain ${chainId}`);
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

import { ClientConstants } from "../constants";
import { AxiomV2ClientOverrides, AxiomV2ClientOptions, AxiomV2FeeDataExtended } from "../types";
import { PublicClient } from "viem";
import { getAxiomV2QueryAddress, getOpStackGasPriceOracleAddress } from "./address";
import { getAxiomV2Abi, getOpStackGasPriceOracleAbi } from "./abi";
import { getChainDefaults, isArbitrumChain, isMainnetChain, isOpStackChain, isScrollChain } from "./chain";
import { publicActionsL2 } from 'viem/op-stack';
import { readContractValueBigInt } from "./viem";

// Calculate the payment amount (in wei) for axiom query.
export async function calculatePayment(
  chainId: string,
  publicClient: PublicClient,
  feeData: AxiomV2FeeDataExtended,
): Promise<bigint> {
  const defaults = getChainDefaults(chainId);
  const queryFee = BigInt(feeData.axiomQueryFee);
  const payment = queryFee + feeData.proofVerificationGas;
  if (isMainnetChain(chainId)) {
    return payment;
  } else if (isOpStackChain(chainId) || isArbitrumChain(chainId) || isScrollChain(chainId)) {
    // Get the projected callback cost
    const projectedCallbackCost = await getProjectedL2CallbackCost(
      chainId, publicClient,
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
  options: AxiomV2ClientOptions,
): Promise<AxiomV2FeeDataExtended> {
  const axiomV2QueryAddr = options.overrides?.queryAddress ?? getAxiomV2QueryAddress(chainId);
  const defaults = getChainDefaults(chainId);
  const axiomQueryFee = await readContractValueBigInt(
    publicClient,
    axiomV2QueryAddr,
    getAxiomV2Abi(),
    "axiomQueryFee",
    [],
    defaults.axiomQueryFeeWei
  );

  if (isMainnetChain(chainId)) {
    return {
      axiomQueryFee,
      proofVerificationGas: defaults.proofVerificationGas, // Assuming defaults.proofVerificationGas is the correct default value
    };
  } else if (isOpStackChain(chainId) || isArbitrumChain(chainId) || isScrollChain(chainId)) {
    const defaultAxiomQueryFee = getChainDefaults(chainId).axiomQueryFeeWei;

    // Get the projected callback cost
    const projectedCallbackCost = await getProjectedL2CallbackCost(chainId, publicClient, defaults.proofVerificationGas); // Assuming defaults.proofVerificationGas is the correct default value

    // overrideAxiomQueryFeeL2 = AXIOM_QUERY_FEE + projectedCallbackCost
    const overrideAxiomQueryFeeL2 = defaultAxiomQueryFee + projectedCallbackCost;

    return {
      axiomQueryFee: overrideAxiomQueryFeeL2,
      proofVerificationGas: defaults.proofVerificationGas, // Assuming defaults.proofVerificationGas is the correct default value
    };
  } else {
    throw new Error(`Unsupported chain ${chainId}`);
  }
}

export async function getProjectedL2CallbackCost(
  chainId: string,
  publicClient: PublicClient,
  proofVerificationGas: bigint,
): Promise<bigint> {
  if (isOpStackChain(chainId)) {
    // on OP Stack
    // projectedCallbackCost =
    //   opStackGasOracle.getL1Fee(AXIOM_PROOF_CALLDATA_BYTES)
    const l1Fee = await readContractValueBigInt(
      publicClient.extend(publicActionsL2()),
      getOpStackGasPriceOracleAddress() as `0x${string}`,
      getOpStackGasPriceOracleAbi(),
      "getL1Fee",
      [ClientConstants.AXIOM_PROOF_CALLDATA_BYTES],
    );
    return (l1Fee * ClientConstants.L1_FEE_NUMERATOR / ClientConstants.L1_FEE_DENOMINATOR);
  } else if (isArbitrumChain(chainId)) {
    throw new Error("Arbitrum not yet supported");
  } else if (isScrollChain(chainId)) {
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
    abi: getAxiomV2Abi(),
    functionName: "balances",
    args: [userAddress],
  });
  return balance.toString();
}

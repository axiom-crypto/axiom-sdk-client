import { ClientConstants } from "../constants";
import { AxiomV2QueryOptions } from "@axiom-crypto/circuit";
import { AbiType, AxiomV2ClientOverrides } from "../types";
import { PublicClient } from "viem";
import { getAxiomV2QueryAddress } from "./address";
import { getAxiomV2Abi } from "./abi";

export async function calculatePayment(
  axiomV2QueryAddr: string,
  publicClient: PublicClient,
  options?: AxiomV2QueryOptions
): Promise<bigint> {
  // Get proofVerificationGas from contract
  let proofVerificationGas;
  try {
    proofVerificationGas = await publicClient.readContract({
      address: axiomV2QueryAddr,
      abi: getAxiomV2Abi(AbiType.Query),
      functionName: "proofVerificationGas",
      args: [],
    }) as bigint; // in gas units
  } catch (e) {
    console.log(`Unable to read proofVerificationGas from contract`);
  }
  proofVerificationGas = BigInt(proofVerificationGas ?? 0);
  if (proofVerificationGas === 0n) {
    proofVerificationGas = ClientConstants.FALLBACK_PROOF_VERIFICATION_GAS;
  }

  // Get axiomQueryFee from contract
  let axiomQueryFee;
  try {
    axiomQueryFee = await publicClient.readContract({
      address: axiomV2QueryAddr,
      abi: getAxiomV2Abi(AbiType.Query),
      functionName: "axiomQueryFee",
      args: [],
    }) as bigint; // in wei
  } catch (e) {
    console.log(`Unable to read axiomQueryFee from contract`);
  }
  axiomQueryFee = BigInt(axiomQueryFee ?? 0);
  if (axiomQueryFee === 0n) {
    axiomQueryFee = ClientConstants.FALLBACK_AXIOM_QUERY_FEE_WEI;
  }

  // Convert callback gas limit to wei
  const callbackGasLimit = BigInt(options?.callbackGasLimit ?? ClientConstants.DEFAULT_CALLBACK_GAS_LIMIT);

  // payment = maxFeePerGas * (proofVerificationGas + callbackGasLimit) + axiomQueryFee
  const payment =
    BigInt(options?.maxFeePerGas ?? ClientConstants.DEFAULT_MAX_FEE_PER_GAS_WEI) *
      (proofVerificationGas + callbackGasLimit) + axiomQueryFee;
  return payment;
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

import { ethers } from "ethers"
import { AbiType, AxiomV2QueryOptions, getAxiomV2Abi, getAxiomV2QueryAddress } from "../../../src";
import { ClientConstants } from "../../../src/constants";
import { calculatePayment } from "../../../src/lib/paymentCalc";
import { createPublicClient, http } from "viem";
import { viemChain } from "../../../src/lib/viem";

async function calculatePaymentEthers(axiomV2Query: ethers.Contract, options?: AxiomV2QueryOptions): Promise<bigint> {
  // Get proofVerificationGas from contract
  let proofVerificationGas = await axiomV2Query.proofVerificationGas(); // in gas units
  if (proofVerificationGas === 0n) {
    proofVerificationGas = ClientConstants.FALLBACK_PROOF_VERIFICATION_GAS;
  }
  proofVerificationGas = proofVerificationGas.toString();

  // Get axiomQueryFee from contract
  let axiomQueryFee = await axiomV2Query.axiomQueryFee(); // in wei
  if (axiomQueryFee === 0n) {
    axiomQueryFee = ClientConstants.FALLBACK_AXIOM_QUERY_FEE_WEI;
  }
  const axiomQueryFeeWei = ethers.parseUnits(axiomQueryFee.toString(), "wei");

  // Convert callback gas limit to wei
  const callbackGasLimit = (options?.callbackGasLimit ?? ClientConstants.DEFAULT_CALLBACK_GAS_LIMIT).toString();

  // payment = maxFeePerGas * (proofVerificationGas + callbackGasLimit) + axiomQueryFee
  const payment =
    BigInt(options?.maxFeePerGas ?? ClientConstants.DEFAULT_MAX_FEE_PER_GAS_WEI) *
      (BigInt(proofVerificationGas) + BigInt(callbackGasLimit)) +
    BigInt(axiomQueryFeeWei);
  return payment;
}

describe("PaymentCalc", () => {
  const CHAIN_ID = "11155111";
  const publicClient = createPublicClient({
    chain: viemChain(CHAIN_ID, process.env.PROVIDER_URI_SEPOLIA as string),
    transport: http(process.env.PROVIDER_URI_SEPOLIA as string),
  });

  test("Payment calculation with ethers should equal viem", async () => {
    const axiomV2QueryAddr = getAxiomV2QueryAddress(CHAIN_ID);
    const ethersProvider = new ethers.JsonRpcProvider(process.env.PROVIDER_URI_SEPOLIA as string);
    const ethersAxiomV2Query = new ethers.Contract(axiomV2QueryAddr, getAxiomV2Abi(AbiType.Query), ethersProvider);
    const viemPayment = await calculatePayment(axiomV2QueryAddr, publicClient);
    const ethersPayment = await calculatePaymentEthers(ethersAxiomV2Query);
    expect(viemPayment).toEqual(ethersPayment);
  });
});
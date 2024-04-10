import { Axiom, getOpStackL1BlockAttributesAbi, getOpStackL1BlockAttributesAddress } from "../../../../src";
import { createPublicClient, http } from "viem";
import { viemChain } from "../../../../src/lib/viem";
import { circuit } from "../../../integration/circuits/quickstart/average.circuit";
import compiledCircuit from "../../circuits/average.compiled.json";
import inputs from "../../../integration/circuits/quickstart/average.inputs.json";
import { ClientConstants } from "../../../../src/lib/constants";
import { getChainDefaults } from "../../../../src/lib/chain";

describe("PaymentCalc: Base", () => {
  const CHAIN_ID = "84532"; // Base Sepolia
  const publicClient = createPublicClient({
    chain: viemChain(CHAIN_ID, process.env[`PROVIDER_URI_${CHAIN_ID}`] as string),
    transport: http(process.env[`PROVIDER_URI_${CHAIN_ID}`] as string),
  });

  let baseFeeScalar: bigint;
  let basefee: bigint;
  let blobBaseFeeScalar: bigint;
  let blobBaseFee: bigint;

  const calculateOpStackCallbackCost = (
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

  const calculateQueryCost = (
    basefee: bigint,
    baseFeeScalar: bigint,
    blobBaseFee: bigint,
    blobBaseFeeScalar: bigint,
    maxFeePerGas: bigint,
    callbackGasLimit: bigint,
    proofVerificationGas: bigint
  ): bigint => {
    const projectedCallbackCost = calculateOpStackCallbackCost(basefee, baseFeeScalar, blobBaseFee, blobBaseFeeScalar, maxFeePerGas, callbackGasLimit, proofVerificationGas);
    const overrideAxiomQueryFee = getChainDefaults(CHAIN_ID).axiomQueryFeeWei + projectedCallbackCost - maxFeePerGas * (callbackGasLimit + proofVerificationGas);
    const queryCost = overrideAxiomQueryFee + maxFeePerGas * (callbackGasLimit + proofVerificationGas);
    return queryCost;
  }

  const percentDiffX100 = (a: bigint, b: bigint): bigint => {
    let percentDiff = (a - b) * 10000n / a;
    if (percentDiff < 0) {
      percentDiff = -percentDiff;
    }
    return percentDiff;
  }

  beforeEach(async () => {
    // Read values from chain
    baseFeeScalar = BigInt(await publicClient.readContract({
      address: getOpStackL1BlockAttributesAddress() as `0x${string}`,
      abi: getOpStackL1BlockAttributesAbi(),
      functionName: "baseFeeScalar",
    }) as bigint);
    basefee = BigInt(await publicClient.readContract({
      address: getOpStackL1BlockAttributesAddress() as `0x${string}`,
      abi: getOpStackL1BlockAttributesAbi(),
      functionName: "basefee",
    }) as bigint);
    blobBaseFeeScalar = BigInt(await publicClient.readContract({
      address: getOpStackL1BlockAttributesAddress() as `0x${string}`,
      abi: getOpStackL1BlockAttributesAbi(),
      functionName: "blobBaseFeeScalar",
    }) as bigint);
    blobBaseFee = BigInt(await publicClient.readContract({
      address: getOpStackL1BlockAttributesAddress() as `0x${string}`,
      abi: getOpStackL1BlockAttributesAbi(),
      functionName: "blobBaseFee",
    }) as bigint);
  });

  test("Payment calculation default based on options", async () => {
    const maxFeePerGas = 5000000000n;
    const callbackGasLimit = getChainDefaults(CHAIN_ID).callbackGasLimit;
    const proofVerificationGas = getChainDefaults(CHAIN_ID).proofVerificationGas;

    const axiom = new Axiom({
      circuit,
      compiledCircuit,
      chainId: CHAIN_ID,
      provider: process.env[`PROVIDER_URI_${CHAIN_ID}`] as string,
      privateKey: process.env.PRIVATE_KEY_ANVIL as string,
      callback: {
        target: "0x81908149E769236F1c9e62b468d07899CB95890F",
      },
      options: {
        maxFeePerGas: maxFeePerGas.toString(),
      },
    });
    await axiom.init();
    await axiom.prove(inputs);
    const args = axiom.getSendQueryArgs();

    const queryCost = calculateQueryCost(basefee, baseFeeScalar, blobBaseFee, blobBaseFeeScalar, maxFeePerGas, callbackGasLimit, proofVerificationGas);
    let percentDiff = percentDiffX100(queryCost, BigInt(args?.value ?? 0));
    expect(percentDiff).toBeLessThan(500n); // 5%
  }, 20000);

  test("Payment calculation high based on options", async () => {
    const maxFeePerGas = 500000000000n;
    const callbackGasLimit = 1000000000n;
    const proofVerificationGas = getChainDefaults(CHAIN_ID).proofVerificationGas;

    const axiom = new Axiom({
      circuit,
      compiledCircuit,
      chainId: CHAIN_ID,
      provider: process.env[`PROVIDER_URI_${CHAIN_ID}`] as string,
      privateKey: process.env.PRIVATE_KEY_ANVIL as string,
      callback: {
        target: "0x81908149E769236F1c9e62b468d07899CB95890F",
      },
      options: {
        maxFeePerGas: maxFeePerGas.toString(),
        callbackGasLimit: Number(callbackGasLimit),
      },
    });
    await axiom.init();
    await axiom.prove(inputs);
    const args = axiom.getSendQueryArgs();

    const queryCost = calculateQueryCost(basefee, baseFeeScalar, blobBaseFee, blobBaseFeeScalar, maxFeePerGas, callbackGasLimit, proofVerificationGas);
    let percentDiff = percentDiffX100(queryCost, BigInt(args?.value ?? 0));
    expect(percentDiff).toBeLessThan(500n); // 5%
  }, 20000);

  test("Payment calculation low based on options", async () => {
    const maxFeePerGas = 5000000000n;
    const callbackGasLimit = 1000n;
    const proofVerificationGas = getChainDefaults(CHAIN_ID).proofVerificationGas;

    const axiom = new Axiom({
      circuit,
      compiledCircuit,
      chainId: CHAIN_ID,
      provider: process.env[`PROVIDER_URI_${CHAIN_ID}`] as string,
      privateKey: process.env.PRIVATE_KEY_ANVIL as string,
      callback: {
        target: "0x81908149E769236F1c9e62b468d07899CB95890F",
      },
      options: {
        maxFeePerGas: maxFeePerGas.toString(),
        callbackGasLimit: Number(callbackGasLimit),
      },
    });
    await axiom.init();
    await axiom.prove(inputs);
    const args = axiom.getSendQueryArgs();
    
    const queryCost = calculateQueryCost(basefee, baseFeeScalar, blobBaseFee, blobBaseFeeScalar, maxFeePerGas, callbackGasLimit, proofVerificationGas);
    let percentDiff = percentDiffX100(queryCost, BigInt(args?.value ?? 0));
    expect(percentDiff).toBeLessThan(500n); // 5%
  }, 20000);

  test("Set overrideAxiomQueryFee greater than standard payment", async () => {
    const maxFeePerGas = 5000000000n
    const callbackGasLimit = getChainDefaults(CHAIN_ID).callbackGasLimit;
    const proofVerificationGas = getChainDefaults(CHAIN_ID).proofVerificationGas;

    const axiom = new Axiom({
      circuit,
      compiledCircuit,
      chainId: CHAIN_ID,
      provider: process.env[`PROVIDER_URI_${CHAIN_ID}`] as string,
      privateKey: process.env.PRIVATE_KEY_ANVIL as string,
      callback: {
        target: "0x4A4e2D8f3fBb3525aD61db7Fc843c9bf097c362e",
      },
      options: {
        maxFeePerGas: maxFeePerGas.toString(),
        overrideAxiomQueryFee: "500000000000000000",
      },
    });
    await axiom.init();
    await axiom.prove(inputs);
    const args = axiom.getSendQueryArgs();
    expect(args?.value).toEqual(502600000000000000n);
  }, 20000);

  test("Set overrideAxiomQueryFee less than standard payment", async () => {
    const maxFeePerGas = 5000000000n;
    const callbackGasLimit = getChainDefaults(CHAIN_ID).callbackGasLimit;
    const proofVerificationGas = getChainDefaults(CHAIN_ID).proofVerificationGas;

    const axiom = new Axiom({
      circuit,
      compiledCircuit,
      chainId: CHAIN_ID,
      provider: process.env[`PROVIDER_URI_${CHAIN_ID}`] as string,
      privateKey: process.env.PRIVATE_KEY_ANVIL as string,
      callback: {
        target: "0x4A4e2D8f3fBb3525aD61db7Fc843c9bf097c362e",
      },
      options: {
        maxFeePerGas: maxFeePerGas.toString(),
        overrideAxiomQueryFee: "500000", // overrideAxiomQueryFee will get overridden with default if it's too low
      },
    });
    await axiom.init();
    await axiom.prove(inputs);
    const args = axiom.getSendQueryArgs();
    
    const queryCost = calculateQueryCost(basefee, baseFeeScalar, blobBaseFee, blobBaseFeeScalar, maxFeePerGas, callbackGasLimit, proofVerificationGas);
    let percentDiff = percentDiffX100(queryCost, BigInt(args?.value ?? 0));
    expect(percentDiff).toBeLessThan(500n); // 5%
  }, 20000);
});
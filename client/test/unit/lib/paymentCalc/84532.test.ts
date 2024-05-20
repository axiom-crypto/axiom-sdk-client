import { Axiom, getOpStackL1BlockAttributesAbi, getOpStackL1BlockAttributesAddress } from "../../../../src";
import { createPublicClient, http } from "viem";
import { viemChain } from "../../../../src/lib/viem";
import { circuit } from "../../../circuits/quickstart/average.circuit";
import compiledCircuit from "../../../circuits/quickstart/average.compiled.json";
import inputs from "../../../circuits/quickstart/11155111/average.inputs.json";
import { getChainDefaults } from "../../../../src/lib/chain";
import { calculateQueryCost, percentDiffX100 } from "./calc";

const DIFF_THRESHOLD_X100 = 800n; // 8%

describe("PaymentCalc: Base", () => {
  const CHAIN_ID = "84532"; // Base Sepolia
  const publicClient = createPublicClient({
    chain: viemChain(CHAIN_ID, process.env[`PROVIDER_URI_${CHAIN_ID}`] as string),
    transport: http(process.env[`PROVIDER_URI_${CHAIN_ID}`] as string),
  });

  const config = {
    circuit,
    compiledCircuit,
    chainId: CHAIN_ID,
    rpcUrl: process.env[`PROVIDER_URI_${CHAIN_ID}`] as string,
    privateKey: process.env.PRIVATE_KEY_ANVIL as string,
    callback: {
      target: "0x81908149E769236F1c9e62b468d07899CB95890F",
    },
  }

  let baseFeeScalar: bigint;
  let basefee: bigint;
  let blobBaseFeeScalar: bigint;
  let blobBaseFee: bigint;

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
      ...config,
      options: {
        maxFeePerGas: maxFeePerGas.toString(),
      },
    });
    await axiom.init();
    await axiom.prove(inputs);
    const args = axiom.getSendQueryArgs();

    const queryCost = calculateQueryCost(CHAIN_ID, basefee, baseFeeScalar, blobBaseFee, blobBaseFeeScalar, maxFeePerGas, callbackGasLimit, proofVerificationGas);
    let percentDiff = percentDiffX100(queryCost, BigInt(args?.value ?? 0));
    expect(percentDiff).toBeLessThan(DIFF_THRESHOLD_X100);
  }, 30000);

  test("Payment calculation high based on options", async () => {
    const maxFeePerGas = 500000000000n;
    const callbackGasLimit = 1000000000n;
    const proofVerificationGas = getChainDefaults(CHAIN_ID).proofVerificationGas;

    const axiom = new Axiom({
      ...config,
      options: {
        maxFeePerGas: maxFeePerGas.toString(),
        callbackGasLimit: Number(callbackGasLimit),
      },
    });
    await axiom.init();
    await axiom.prove(inputs);
    const args = axiom.getSendQueryArgs();

    const queryCost = calculateQueryCost(CHAIN_ID, basefee, baseFeeScalar, blobBaseFee, blobBaseFeeScalar, maxFeePerGas, callbackGasLimit, proofVerificationGas);
    let percentDiff = percentDiffX100(queryCost, BigInt(args?.value ?? 0));
    expect(percentDiff).toBeLessThan(DIFF_THRESHOLD_X100);
  }, 30000);

  test("Payment calculation low based on options", async () => {
    const maxFeePerGas = 5000000000n;
    const callbackGasLimit = 1000n;
    const proofVerificationGas = getChainDefaults(CHAIN_ID).proofVerificationGas;

    const axiom = new Axiom({
      ...config,
      options: {
        maxFeePerGas: maxFeePerGas.toString(),
        callbackGasLimit: Number(callbackGasLimit),
      },
    });
    await axiom.init();
    await axiom.prove(inputs);
    const args = axiom.getSendQueryArgs();
    
    const queryCost = calculateQueryCost(CHAIN_ID, basefee, baseFeeScalar, blobBaseFee, blobBaseFeeScalar, maxFeePerGas, callbackGasLimit, proofVerificationGas);
    let percentDiff = percentDiffX100(queryCost, BigInt(args?.value ?? 0));
    expect(percentDiff).toBeLessThan(DIFF_THRESHOLD_X100);
  }, 30000);

  test("Set overrideAxiomQueryFee greater than standard payment", async () => {
    const maxFeePerGas = 5000000000n
    const callbackGasLimit = getChainDefaults(CHAIN_ID).callbackGasLimit;
    const proofVerificationGas = getChainDefaults(CHAIN_ID).proofVerificationGas;

    const axiom = new Axiom({
      circuit,
      compiledCircuit,
      chainId: CHAIN_ID,
      rpcUrl: process.env[`PROVIDER_URI_${CHAIN_ID}`] as string,
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
  }, 30000);

  test("Set overrideAxiomQueryFee less than standard payment", async () => {
    const maxFeePerGas = 5000000000n;
    const callbackGasLimit = getChainDefaults(CHAIN_ID).callbackGasLimit;
    const proofVerificationGas = getChainDefaults(CHAIN_ID).proofVerificationGas;

    const axiom = new Axiom({
      circuit,
      compiledCircuit,
      chainId: CHAIN_ID,
      rpcUrl: process.env[`PROVIDER_URI_${CHAIN_ID}`] as string,
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
    
    const queryCost = calculateQueryCost(CHAIN_ID, basefee, baseFeeScalar, blobBaseFee, blobBaseFeeScalar, maxFeePerGas, callbackGasLimit, proofVerificationGas);
    let percentDiff = percentDiffX100(queryCost, BigInt(args?.value ?? 0));
    expect(percentDiff).toBeLessThan(DIFF_THRESHOLD_X100);
  }, 30000);
});
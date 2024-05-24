import {
  AxiomV2Callback,
  AxiomV2ComputeQuery,
  AxiomV2FeeData,
} from "@axiom-crypto/circuit";
import {
  getByteLength,
} from "@axiom-crypto/circuit/pkg/tools";
import { AbiType, AxiomV2QueryOptions, AxiomV2SendQueryArgsParams, CircuitInputType } from "../types";
import { createPublicClient, http } from 'viem';
import { getAxiomV2Abi, readContractValueBigInt, viemChain } from "../lib";
import { getChainDefaults } from "../lib/chain";

export function validateChainId(chainId: string) {
  switch (chainId) {
    case "1": // Mainnet
    case "11155111":  // Sepolia
    case "8453":  // Base
    case "84532":  // Base Sepolia
      return;
    default:
      throw new Error(`Unsupported chainId ${chainId}`);
  }
}

export function convertInputSchemaToJsonString(args: {[arg: string]: CircuitInputType}): string {
  const inputs = Object.keys(args).map((key: string) => {
    let argType = args[key];
    let postfix = "";
    if (argType.slice(-2) === "[]") {
      postfix = "[]";
      argType = argType.slice(0, -2);
    }
    if (getByteLength(argType) < 32) {
      return `"${key}": "CircuitValue${postfix}"`;
    } 
    return `"${key}": "CircuitValue256${postfix}"`;
  });
  return `{${inputs.map((inputLine: string) => `\n  ${inputLine}`)}\n}`;
}

export function argsArrToObj(
  args: (string | AxiomV2Callback | AxiomV2ComputeQuery | AxiomV2FeeData)[]
): AxiomV2SendQueryArgsParams {
  return {
    sourceChainId: args[0] as string,
    dataQueryHash: args[1] as string,
    computeQuery: args[2] as AxiomV2ComputeQuery,
    callback: args[3] as AxiomV2Callback,
    feeData: args[4] as AxiomV2FeeData,
    userSalt: args[5] as string,
    refundee: args[6] as string,
    dataQuery: args[7] as string,
  };
}

export function argsObjToArr(
  args: AxiomV2SendQueryArgsParams
): (string | AxiomV2Callback | AxiomV2ComputeQuery | AxiomV2FeeData)[] {
  return [
    args.sourceChainId,
    args.dataQueryHash,
    args.computeQuery,
    args.callback,
    args.feeData,
    args.userSalt,
    args.refundee,
    args.dataQuery,
  ]
}

export async function getMaxFeePerGas(
  chainId: string,
  providerUri: string,
  axiomQueryAddress: string,
  options?: AxiomV2QueryOptions,
): Promise<string> {
  const publicClient = createPublicClient({
    chain: viemChain(chainId, providerUri),
    transport: http(providerUri),
  });
  const providerFeeData = await publicClient.estimateFeesPerGas();
  const providerMaxFeePerGas = providerFeeData.maxFeePerGas ?? 0n;

  try {
    const sdkMinMaxFeePerGas = getChainDefaults(chainId).minMaxFeePerGasWei;
    const contractMinMaxFeePerGas = await readContractValueBigInt(
      publicClient,
      axiomQueryAddress,
      getAxiomV2Abi(AbiType.Query),
      "minMaxFeePerGas",
      [],
      sdkMinMaxFeePerGas,
    );
    
    let maxFeePerGas = BigInt(options?.maxFeePerGas ?? contractMinMaxFeePerGas);
    if (providerMaxFeePerGas > maxFeePerGas) {
      maxFeePerGas = providerMaxFeePerGas;
    }
    if (sdkMinMaxFeePerGas > maxFeePerGas) {
      maxFeePerGas = sdkMinMaxFeePerGas;
    }
    
    if (maxFeePerGas === contractMinMaxFeePerGas) {
      console.log(`Network gas price below threshold. Using contract-defined minMaxFeePerGas: ${maxFeePerGas.toString()}`);
    } else if (maxFeePerGas === sdkMinMaxFeePerGas) {
      console.log(`Network gas price below threshold. Using SDK-defined minimum minMaxFeePerGas: ${maxFeePerGas.toString()}`);
    }
    return maxFeePerGas.toString();
  } catch (e) {
    const defaultMinMaxFeePerGas = getChainDefaults(chainId).minMaxFeePerGasWei.toString();
    console.log(`Unable to read minMaxFeePerGas from contract, returning default value of ${defaultMinMaxFeePerGas}`);
    return defaultMinMaxFeePerGas;
  }
}

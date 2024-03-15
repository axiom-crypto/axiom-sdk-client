import {
  AxiomV2QueryBuilder,
  AxiomV2Callback,
  AxiomV2ComputeQuery,
  AxiomV2FeeData,
} from "@axiom-crypto/circuit";
import {
  getByteLength,
} from "@axiom-crypto/circuit/pkg/tools";
import { AbiType, AxiomV2SendQueryArgsParams, CircuitInputType } from "../types";
import { createPublicClient, http } from 'viem';
import { mainnet, sepolia } from 'viem/chains';
import { ClientConstants } from "../constants";
import { getAxiomV2Abi, getAxiomV2QueryAddress } from "../lib";

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

export function convertChainIdToViemChain(chainId: string) {
  switch(chainId) {
    case "1":
      return mainnet;
    case "11155111":
      return sepolia;
    default:
      throw new Error(`Unsupported chainId ${chainId}`);
  }
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

export async function getMaxFeePerGas(axiom: AxiomV2QueryBuilder): Promise<string> {
  const providerFeeData = (await axiom.config.provider.getFeeData()).maxFeePerGas as bigint;
  const publicClient = createPublicClient({
    chain: convertChainIdToViemChain(axiom.config.chainId.toString()),
    transport: http(axiom.config.providerUri),
  });
  let contractMinMaxFeePerGas = await publicClient.readContract({
    address: getAxiomV2QueryAddress(axiom.config.chainId.toString()) as `0x${string}`,
    abi: getAxiomV2Abi(AbiType.Query),
    functionName: "minMaxFeePerGas",
    args: [],
  }) as bigint;
  if (contractMinMaxFeePerGas === 0n) {
    contractMinMaxFeePerGas = ClientConstants.MIN_MAX_FEE_PER_GAS;
  }
  if (providerFeeData > contractMinMaxFeePerGas) {
    return providerFeeData.toString();
  }
  console.log(`Network gas price below threshold. Using contract-defined minimum maxFeePerGas of ${contractMinMaxFeePerGas.toString()}`);
  return contractMinMaxFeePerGas.toString();
}

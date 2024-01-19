import {
  AxiomSdkCore,
  AxiomV2Callback,
  AxiomV2ComputeQuery,
  AxiomV2FeeData,
  getByteLength,
} from "@axiom-crypto/core";
import { AxiomV2SendQueryArgsParams, CircuitInputType } from "./types";
import { createPublicClient, http } from 'viem';
import { mainnet, sepolia } from 'viem/chains';
import { ClientConstants } from "../constants";

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

export async function getMaxFeePerGas(axiom: AxiomSdkCore, maximumMaxFeePerGas?: string): Promise<string> {
  if (maximumMaxFeePerGas === undefined) {
    maximumMaxFeePerGas = ClientConstants.MAX_MAX_FEE_PER_GAS.toString();
  }
  const providerFeeData = (await axiom.config.provider.getFeeData()).maxFeePerGas as bigint;
  const publicClient = createPublicClient({
    chain: convertChainIdToViemChain(axiom.config.chainId.toString()),
    transport: http(axiom.config.providerUri),
  });
  let contractMinMaxFeePerGas = await publicClient.readContract({
    address: axiom.getAxiomQueryAddress() as `0x${string}`,
    abi: axiom.getAxiomQueryAbi(),
    functionName: "minMaxFeePerGas",
    args: [],
  }) as bigint;
  if (contractMinMaxFeePerGas === 0n) {
    contractMinMaxFeePerGas = ClientConstants.MIN_MAX_FEE_PER_GAS;
  }
  if (providerFeeData > contractMinMaxFeePerGas) {
    const maximumMaxFeePerGasBigInt = BigInt(maximumMaxFeePerGas);
    if (providerFeeData > maximumMaxFeePerGasBigInt) {
      return maximumMaxFeePerGas;
    }
    return providerFeeData.toString();
  }
  return contractMinMaxFeePerGas.toString();
}
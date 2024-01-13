import { AxiomV2Callback, AxiomV2ComputeQuery, AxiomV2FeeData, getByteLength } from "@axiom-crypto/core";
import { AxiomV2SendQueryArgsParams, CircuitInputType } from "./types";
import { mainnet, goerli, sepolia } from 'viem/chains';

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
    case "5":
      return goerli;
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
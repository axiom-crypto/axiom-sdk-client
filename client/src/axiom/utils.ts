import { getByteLength } from "@axiom-crypto/core";
import { CircuitInputType } from "./types";
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
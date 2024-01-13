import path from 'path';
import { AxiomSdkCore } from "@axiom-crypto/core";
import { getProvider, readJsonFromFile, saveJsonToFile } from "./utils";
import { buildSendQuery } from "../sendQuery";

export const queryParams = async (
  callbackTarget: string,
  options: {
    refundAddress: string;
    sourceChainId: string;
    callbackExtraData: string;
    caller: string;
    outputs?: string;
    proven?: string;
    provider?: string;
    maxFeePerGas?: string;
    callbackGasLimit?: number;
    mock?: boolean;
  },
) => {
  if (!options.refundAddress) {
    throw new Error("Please provide a refund address (--refundAddress <address>)");
  }
  if (!options.sourceChainId) {
    throw new Error("Please provide a source chain ID (--sourceChainId <id>)");
  }
  let defaultPath = path.resolve(path.join("app", "axiom"));
  let provenFile = path.join(defaultPath, "data", "proven.json");
  if (options.proven !== undefined) {
      provenFile = options.proven;
  }
  const outputsJson = readJsonFromFile(provenFile);
  const provider = getProvider(options.provider);
  const axiom = new AxiomSdkCore({
    providerUri: provider,
    chainId: options.sourceChainId,
    version: "v2",
    mock: options.mock ?? false,
  });
  try {
    let build = await buildSendQuery({
      axiom,
      dataQuery: outputsJson.dataQuery,
      computeQuery: outputsJson.computeQuery,
      callback: {
        target: callbackTarget,
        extraData: options.callbackExtraData ?? "0x",
      },
      options: {
        refundee: options.refundAddress,
        maxFeePerGas: options.maxFeePerGas,
        callbackGasLimit: options.callbackGasLimit,
      },
      caller: options.caller ?? options.refundAddress,
    });
    build.value = build.value.toString() as any;
    const args = {
      sourceChainId: build.args[0],
      dataQueryHash: build.args[1],
      computeQuery: build.args[2],
      callback: build.args[3],
      feeData: build.args[4],
      userSalt: build.args[5],
      refundee: build.args[6],
      dataQuery: build.args[7],
    }; 
    const res = {
      value: build.value,
      mock: build.mock,
      queryId: build.queryId,
      args,
      calldata: build.calldata,
    };
    let outputsFile = path.join(defaultPath, "data", "sendQuery.json");
    if (options.outputs !== undefined) {
        outputsFile = options.outputs;
    }
    saveJsonToFile(res, outputsFile);
  } catch (e) {
    console.error(e);
  }
};

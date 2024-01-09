import path from 'path';
import { Axiom } from "@axiom-crypto/core";
import { getProvider, readJsonFromFile, saveJsonToFile } from "./utils";
import { buildSendQuery } from "../sendQuery";

export const queryParams = async (
  callbackAddress: string,
  options: {
    refundAddress: string;
    sourceChainId: string;
    callbackExtraData: string;
    calldata: boolean;
    caller: string;
    output?: string;
    input?: string;
    provider?: string;
    maxFeePerGas?: string;
    callbackGasLimit?: number;
  },
) => {
  if (!options.refundAddress) {
    throw new Error("Please provide a refund address (--refundAddress <address>)");
  }
  if (!options.sourceChainId) {
    throw new Error("Please provide a source chain ID (--sourceChainId <id>)");
  }
  let defaultPath = path.resolve(path.join("app", "axiom"));
  let inputFile = path.join(defaultPath, "data", "output.json");
  if (options.input !== undefined) {
      inputFile = options.input;
  }
  const outputJson = readJsonFromFile(inputFile);
  const provider = getProvider(options.provider);
  const axiom = new Axiom({
    providerUri: provider,
    chainId: options.sourceChainId,
    version: "v2",
    // mock? does not change behavior here
  });
  try {
    let build = await buildSendQuery({
      axiom,
      dataQuery: outputJson.dataQuery,
      computeQuery: outputJson.computeQuery,
      callback: {
        target: callbackAddress,
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
    let res: any;
    if (!options.calldata) {
      res = {
        value: build.value,
        args: build.args,
        queryId: build.queryId,
      };
    } else {
      res = {
        value: build.value,
        calldata: build.calldata,
        queryId: build.queryId,
      };
    }
    let outputFile = path.join(defaultPath, "data", "sendQuery.json");
    if (options.output !== undefined) {
        outputFile = options.output;
    }
    saveJsonToFile(res, outputFile);
  } catch (e) {
    console.error(e);
  }
};

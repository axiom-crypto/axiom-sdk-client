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
    calldata: boolean;
    caller: string;
    output?: string;
    input?: string;
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
  let inputFile = path.join(defaultPath, "data", "proven.json");
  if (options.input !== undefined) {
      inputFile = options.input;
  }
  const outputJson = readJsonFromFile(inputFile);
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
      dataQuery: outputJson.dataQuery,
      computeQuery: outputJson.computeQuery,
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
    let res: any;
    if (!options.calldata) {
      res = {
        value: build.value,
        mock: build.mock,
        queryId: build.queryId,
        args: build.args,
      };
    } else {
      res = {
        value: build.value,
        mock: build.mock,
        queryId: build.queryId,
        calldata: build.calldata,
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

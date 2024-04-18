import path from 'path';
import { getProvider, readJsonFromFile, saveJsonToFile } from "./utils";
import { buildSendQuery } from "../sendQuery";
import { argsArrToObj } from '../axiom/utils';

export const queryParams = async (
  callbackTarget: string,
  options: {
    refundAddress: string;
    sourceChainId: string;
    callbackExtraData: string;
    caller: string;
    argsMap: boolean;
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
  console.log(`Reading proven circuit JSON from: ${provenFile}`)
  const provenJson = readJsonFromFile(provenFile);
  const providerUri = getProvider(options.provider);
  try {
    let build = await buildSendQuery({
      chainId: options.sourceChainId,
      providerUri,
      dataQuery: provenJson.dataQuery,
      computeQuery: provenJson.computeQuery,
      callback: {
        target: callbackTarget,
        extraData: options.callbackExtraData ?? "0x",
      },
      caller: options.caller ?? options.refundAddress,
      mock: options.mock ?? false,
      options: {
        maxFeePerGas: options.maxFeePerGas,
        callbackGasLimit: options.callbackGasLimit,
      },
    });
    build.value = build.value.toString() as any;
    const res = {
      value: build.value,
      mock: build.mock,
      queryId: build.queryId,
      args: options.argsMap ? argsArrToObj(build.args) : build.args,
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

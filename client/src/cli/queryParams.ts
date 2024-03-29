import path from 'path';
import { AxiomSdkCore } from "@axiom-crypto/core";
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
      dataQuery: provenJson.dataQuery,
      computeQuery: provenJson.computeQuery,
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

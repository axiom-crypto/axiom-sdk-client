import { Axiom } from "@axiom-crypto/core";
import { getProvider, readJsonFromFile, saveJsonToFile } from "./utils";
import { buildSendQuery } from "../sendQuery";

export const sendQuery = async (
  callbackAddress: string,
  options: {
    refundAddress: string;
    sourceChainId: string;
    callbackExtraData: string;
    calldata: boolean;
    output: string;
    input: string;
    caller: string;
    provider?: string;
  },
) => {
  if (!options.refundAddress) {
    throw new Error("Please provide a refund address.");
  }
  if (!options.sourceChainId) {
    throw new Error("Please provide a source chain ID.");
  }
  const provider = getProvider(options.provider);
  const outputJson = readJsonFromFile(options.input);
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
      refundAddress: options.refundAddress,
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
    saveJsonToFile(res, options.output, "sendQuery.json");
  } catch (e) {
    console.error(e);
  }
};

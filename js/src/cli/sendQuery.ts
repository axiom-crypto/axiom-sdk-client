import { Axiom } from "@axiom-crypto/core";
import { getProvider, readJsonFromFile, saveJsonToFile } from "./utils";
import { buildSendQuery } from "../sendQuery";

export const sendQuery = async (options: {
    stats: boolean,
    mock: boolean,
    calldata: boolean,
    args: boolean,
    output: string,
    input: string,
    refundAddress: string,
    caller: string,
    provider?: string,
}) => {
    if (options.args && options.calldata) {
        throw new Error("Please choose either args or calldata.");
    }
    if(!options.refundAddress){
        throw new Error("Please provide a refund address.");
    }
    const provider = getProvider(options.provider);
    const outputJson = readJsonFromFile(options.input);
    const axiom = new Axiom({
        providerUri: provider,
        chainId: 5,
        mock: options.mock,
        version: "v2"
    })
    try {
        let build = await buildSendQuery({
            axiom,
            dataQuery: outputJson.dataQuery,
            computeQuery: outputJson.computeQuery,
            callback: outputJson.callback,
            refundAddress: options.refundAddress,
            caller: options.caller ?? options.refundAddress,
        })
        build.value = build.value.toString() as any;
        let res: any;
        if (options.args) {
            res = {
                value: build.value,
                args: build.args,
                queryId: build.queryId,
            }
        }
        else if (options.calldata) {
            res = {
                value: build.value,
                calldata: build.calldata,
                queryId: build.queryId,
            }
        }
        else {
            res = build;
            delete res.abi;
        }
        saveJsonToFile(res, options.output, "sendQuery.json");
    }
    catch (e) {
        console.error(e);
    }
}
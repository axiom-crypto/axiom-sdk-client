import { Axiom } from "@axiom-crypto/core";
import { AxiomCircuit } from "../js";
import { getFunctionFromTs, getProvider, readJsonFromFile, saveJsonToFile } from "./utils";
import { buildSendQuery } from "../sendQuery";

export const sendQuery = async (options: {
    stats: boolean,
    mock: boolean,
    calldata: boolean,
    args: boolean,
    output: string,
    input: string,
    refundAddress: string,
    provider?: string,
}) => {
    if (options.args && options.calldata) {
        throw new Error("Please choose either args or calldata.");
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
        })
        build.value = build.value.toString() as any;
        let res: any;
        if (options.args) {
            res = {
                value: build.value,
                args: build.args
            }
        }
        else if (options.calldata) {
            res = {
                value: build.value,
                calldata: build.calldata
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
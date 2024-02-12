import path from 'path';
import { AxiomBaseCircuit } from "../js";
import { getFunctionFromTs, getProvider, readInputs, readJsonFromFile, saveJsonToFile } from "./utils";
import { existsSync } from 'fs';

export const prove = async (
    compiledPath: string,
    inputsFile: string,
    options: {
        stats: boolean,
        outputs?: string,
        sourceChainId?: number | string | bigint,
        provider?: string,
        mock?: boolean,
        cache?: string;
    }
) => {
    console.log(`Reading compiled circuit JSON from: ${compiledPath}`);
    const compiled = readJsonFromFile(compiledPath);

    const decoder = new TextDecoder();
    const decodedArray = Buffer.from(compiled.circuit, 'base64');
    const raw = decoder.decode(decodedArray);
    const AXIOM_CLIENT_IMPORT = require("../index");
    const provider = getProvider(options.provider);

    const cache: { [key: string]: string } = {};
    if (options.cache !== undefined && existsSync(options.cache)) {
        const cacheJson = readJsonFromFile(options.cache);
        Object.assign(cache, cacheJson);
    }
    const circuit = new AxiomBaseCircuit({
        f: eval(raw),
        mock: options.mock,
        chainId: options.sourceChainId,
        provider,
        shouldTime: options.stats,
        inputSchema: compiled.inputSchema,
        results: cache,
    })
    const circuitInputs = readInputs(inputsFile, null);
    try {
        let computeQuery;
        if (options.mock === true) {
            circuit.loadSavedMock(compiled);
            computeQuery = await circuit.mockProve(circuitInputs);
        } else {
            circuit.loadSaved(compiled);
            computeQuery = await circuit.run(circuitInputs);
        }
        const computeResults = circuit.getComputeResults();
        const dataQuery = circuit.getDataQuery();
        const res = {
            sourceChainId: circuit.getChainId(),
            mock: options.mock ?? false,
            computeQuery,
            computeResults,
            dataQuery,
        }

        let outfile = path.join(path.dirname(compiledPath), "proven.json");
        if (options.outputs !== undefined) {
            outfile = options.outputs;
        }

        saveJsonToFile(res, outfile);
        if (options.cache) {
            saveJsonToFile(circuit.getResults(), options.cache);
        }
    }
    catch (e) {
        console.error(e);
    }
}
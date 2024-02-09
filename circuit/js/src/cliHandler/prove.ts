import path from 'path';
import { AxiomBaseCircuit } from "../js";
import { getFunctionFromTs, getProvider, readInputs, readJsonFromFile, saveJsonToFile } from "./utils";
import { existsSync } from 'fs';

export const prove = async (
    circuitPath: string,
    options: {
        stats: boolean,
        function?: string,
        compiled?: string,
        outputs?: string,
        sourceChainId?: number | string | bigint,
        provider?: string,
        inputs?: string,
        mock?: boolean,
        cache?: string;
    }
) => {
    let circuitFunction = "circuit";
    if (options.function !== undefined) {
        circuitFunction = options.function;
    }
    const f = await getFunctionFromTs(circuitPath, circuitFunction);
    const provider = getProvider(options.provider);
    let compiledFile = path.join(path.dirname(circuitPath), "data", "compiled.json");
    if (options.compiled !== undefined) {
        compiledFile = options.compiled;
    }
    console.log(`Reading compiled circuit JSON from: ${compiledFile}`);
    const compiledJson = readJsonFromFile(compiledFile);
    const cache: { [key: string]: string } = {};
    if (options.cache !== undefined && existsSync(options.cache)) {
        const cacheJson = readJsonFromFile(options.cache);
        Object.assign(cache, cacheJson);
    }
    const circuit = new AxiomBaseCircuit({
        f: f.circuit,
        mock: options.mock,
        chainId: options.sourceChainId,
        provider,
        shouldTime: options.stats,
        inputSchema: compiledJson.inputSchema,
        results: cache,
    })
    let inputFile = path.join(path.dirname(circuitPath), "data", "inputs.json");
    if (options.inputs !== undefined) {
        inputFile = options.inputs;
    }
    const circuitInputs = readInputs(inputFile, f.defaultInputs);
    try {
        let computeQuery;
        if (options.mock === true) {
            circuit.loadSavedMock(compiledJson);
            computeQuery = await circuit.mockProve(circuitInputs);
        } else {
            circuit.loadSaved(compiledJson);
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

        let outfile = path.join(path.dirname(circuitPath), "data", "proven.json");
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
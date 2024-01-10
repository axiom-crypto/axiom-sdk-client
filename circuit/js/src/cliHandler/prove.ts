import path from 'path';
import { AxiomBaseCircuit } from "../js";
import { getFunctionFromTs, getProvider, readJsonFromFile, saveJsonToFile } from "./utils";

export const prove = async (
    circuitPath: string,
    options: { stats: boolean,
        function?: string,
        compiled?: string,
        output?: string,
        chainId?: number | string | bigint,
        provider?: string,
        inputs?: string,
        mock?: boolean,
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
    const compiledJson = readJsonFromFile(compiledFile);
    const circuit = new AxiomBaseCircuit({
        f: f.circuit,
        mock: options.mock,
        chainId: options.chainId,
        provider,
        shouldTime: true,
        inputSchema: compiledJson.inputSchema,
    })
    let circuitInputs = f.inputs;
    if (options.inputs) {
        circuitInputs = readJsonFromFile(options.inputs);
    }
    else {
        if (circuitInputs === undefined) {
            throw new Error("No inputs provided. Either export `inputs` from your circuit file or provide a path to a json file with inputs.");
        }
    }
    try {
        circuit.loadSaved(compiledJson);
        let computeQuery;
        let computeResults;
        if (options.mock === true) {
            computeQuery = await circuit.mockProve(circuitInputs);
            computeResults = circuit.getComputeResults();
        } else {
            computeQuery = await circuit.run(circuitInputs);
            computeResults = circuit.getComputeResults();
        }
        const dataQuery = circuit.getDataQuery();
        const res = {
            sourceChainId: circuit.getChainId(),
            mock: options.mock ?? false,
            computeQuery,
            computeResults,
            dataQuery,
        }

        let outfile = path.join(path.dirname(circuitPath), "data", "proven.json");
        if (options.output !== undefined) {
            outfile = options.output;
        }

        saveJsonToFile(res, outfile);
    }
    catch (e) {
        console.error(e);
    }
}
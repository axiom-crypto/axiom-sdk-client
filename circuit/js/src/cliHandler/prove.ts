import path from 'path';
import { AxiomBaseCircuit } from "../js";
import { getFunctionFromTs, getProvider, readJsonFromFile, saveJsonToFile } from "./utils";

export const prove = async (
    circuitPath: string,
    options: { stats: boolean,
        function?: string,
        build?: string,
        output?: string,
        chainId?: number | string | bigint,
        provider?: string,
        inputs?: string
    }
) => {
    let circuitFunction = "circuit";
    if (options.function !== undefined) {
        circuitFunction = options.function;
    }
    const f = await getFunctionFromTs(circuitPath, circuitFunction);
    const provider = getProvider(options.provider);
    let buildFile = path.join(path.dirname(circuitPath), "data", "compiled.json");
    if (options.build !== undefined) {
        buildFile = options.build;
    }
    const buildJson = readJsonFromFile(buildFile);
    const circuit = new AxiomBaseCircuit({
        f: f.circuit,
        mock: true,
        chainId: options.chainId,
        provider,
        shouldTime: true,
        inputSchema: buildJson.inputSchema,
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
        circuit.loadSaved(buildJson);
        const computeQuery = await circuit.run(circuitInputs);
        const computeResults = circuit.getComputeResults();
        const dataQuery = circuit.getDataQuery();
        const res = {
            sourceChainId: circuit.getChainId(),
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
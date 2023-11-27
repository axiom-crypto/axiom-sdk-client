import { AxiomCircuit } from "../js";
import { getFunctionFromTs, getProvider, readJsonFromFile, saveJsonToFile } from "./utils";

export const run = async (path: string, options: { stats: boolean, build: string, function: string, output: string, provider?: string, inputs?: string }) => {
    const f = await getFunctionFromTs(path, options.function);
    const provider = getProvider(options.provider);
    const buildJson = readJsonFromFile(options.build);
    const circuit = new AxiomCircuit({
        f: f.circuit,
        mock: true,
        provider,
        shouldTime: true,
    })
    let circuitInputs = f.inputs;
    if (options.inputs) {
        circuitInputs = readJsonFromFile(options.inputs);
    }
    try {
        circuit.loadSaved(buildJson);
        const computeQuery = await circuit.run(circuitInputs);
        const computeResults = circuit.getComputeResults();
        const dataQuery = circuit.getDataQuery();
        const res = {
            computeQuery,
            computeResults,
            dataQuery,
        }
        saveJsonToFile(res, options.output, "output.json");
    }
    catch (e) {
        console.error(e);
    }
}
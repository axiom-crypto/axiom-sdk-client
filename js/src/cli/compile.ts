import { AxiomCircuit } from "../js";
import { getFunctionFromTs, getProvider, readJsonFromFile, saveJsonToFile } from "./utils";

export const compile = async (path: string, options: { stats: boolean, function: string, output: string, provider?: string, inputs?: string }) => {
    const f = await getFunctionFromTs(path, options.function);
    const provider = getProvider(options.provider);
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
        const res = await circuit.compile(circuitInputs);
        saveJsonToFile(res, options.output, "build.json");
    }
    catch (e) {
        console.error(e);
    }
}
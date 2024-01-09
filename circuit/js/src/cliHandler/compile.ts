import path from 'path';
import { AxiomBaseCircuit } from "../js";
import { getFunctionFromTs, getProvider, readJsonFromFile, saveJsonToFile } from "./utils";

export const compile = async (
    circuitPath: string,
    options: { 
        stats: boolean,
        function?: string,
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
    const circuit = new AxiomBaseCircuit({
        f: f.circuit,
        mock: true,
        chainId: options.chainId,
        provider,
        shouldTime: true,
        inputSchema: f.inputSchema,
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
        const res = await circuit.compile(circuitInputs);
        const circuitFn = `const ${f.importName} = AXIOM_CLIENT_IMPORT\n${f.circuit.toString()}`;
        const encoder = new TextEncoder();
        const circuitBuild = encoder.encode(circuitFn);
        const build = {
            ...res,
            circuit: Buffer.from(circuitBuild).toString('base64'),
        }
        
        let outfile = path.join(path.dirname(circuitPath), "data", "compiled.json");
        if (options.output !== undefined) {
            outfile = options.output;
        }

        saveJsonToFile(build, outfile);
    }
    catch (e) {
        console.error(e);
    }
}
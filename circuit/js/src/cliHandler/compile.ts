import path from 'path';
import { AxiomBaseCircuit } from "../js";
import { getFunctionFromTs, getProvider, readInputs, saveJsonToFile } from "./utils";

export const compile = async (
    circuitPath: string,
    options: { 
        stats: boolean,
        function?: string,
        outputs?: string,
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
    const circuit = new AxiomBaseCircuit({
        f: f.circuit,
        mock: options.mock,
        chainId: options.chainId,
        provider,
        shouldTime: options.stats,
        inputSchema: f.inputSchema,
    })
    let inputFile = path.join(path.dirname(circuitPath), "data", "inputs.json");
    if (options.inputs !== undefined) {
        inputFile = options.inputs;
    }
    const circuitInputs = readInputs(inputFile, f.inputs);
    try {
        const res = options.mock ? await circuit.mockCompile(circuitInputs) : await circuit.compile(circuitInputs);
        const circuitFn = `const ${f.importName} = AXIOM_CLIENT_IMPORT\n${f.circuit.toString()}`;
        const encoder = new TextEncoder();
        const circuitBuild = encoder.encode(circuitFn);
        const build = {
            ...res,
            circuit: Buffer.from(circuitBuild).toString('base64'),
        }
        
        let outfile = path.join(path.dirname(circuitPath), "data", "compiled.json");
        if (options.outputs !== undefined) {
            outfile = options.outputs;
        }

        saveJsonToFile(build, outfile);
    }
    catch (e) {
        console.error(e);
    }
}
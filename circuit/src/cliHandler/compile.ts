import path from 'path';
import { AxiomBaseCircuit } from "../js";
import { getFunctionFromTs, getRpcUrl, readJsonFromFile, saveJsonToFile } from "./utils";
import { existsSync, readFileSync } from 'fs';

export const compile = async (
    circuitPath: string,
    options: {
        stats: boolean,
        function?: string,
        outputs?: string,
        chainId?: number | string | bigint,
        rpcUrl?: string,
        mock?: boolean,
        cache?: string,
        force?: boolean,
        defaultInputs?: string,
    }
) => {
    let circuitFunction = "circuit";
    if (options.function !== undefined) {
        circuitFunction = options.function;
    }
    const f = await getFunctionFromTs(circuitPath, circuitFunction);
    const rpcUrl = getRpcUrl(options.rpcUrl);
    const cache: { [key: string]: string } = {};
    if (options.cache !== undefined && existsSync(options.cache)) {
        const cacheJson = readJsonFromFile(options.cache);
        Object.assign(cache, cacheJson);
    }
    const circuit = new AxiomBaseCircuit({
        f: f.circuit,
        mock: options.mock,
        chainId: options.chainId,
        rpcUrl,
        shouldTime: options.stats,
        inputSchema: f.inputSchema,
        results: cache,
        capacity: f.config?.capacity,
        config: f.config?.config,
    })
    let circuitInputs = f.defaultInputs;
    if (options.defaultInputs !== undefined) {
        console.log("Using default inputs from file:", options.defaultInputs);
        circuitInputs = readJsonFromFile(options.defaultInputs);
    }
    const circuitFn = `const ${f.importName} = AXIOM_CLIENT_IMPORT\n${f.circuit.toString()}`;
    const encoder = new TextEncoder();
    const circuitBuild = encoder.encode(circuitFn);
    const circuitString = Buffer.from(circuitBuild).toString('base64');

    let outfile = path.join(path.dirname(circuitPath), "data", "compiled.json");
    if (options.outputs !== undefined) {
        outfile = options.outputs;
    }

    if (options.force) {
        console.log(`Forcing compilation for ${circuitPath}.`);
    } else if (existsSync(outfile)) {
        const existingData = JSON.parse(readFileSync(outfile, 'utf8'));
        if (existingData.circuit === circuitString) {
            console.log(`Circuit ${circuitPath} already compiled to ${outfile}`);
            return;
        }
    }

    const res = options.mock ? await circuit.mockCompile(circuitInputs) : await circuit.compile(circuitInputs);
    const build = {
        ...res,
        circuit: circuitString,
    }

    saveJsonToFile(build, outfile);
    if (options.cache) {
        saveJsonToFile(circuit.getResults(), options.cache);
    }
};

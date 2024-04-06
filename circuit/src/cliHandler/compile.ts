import path from 'path';
import { AxiomBaseCircuit } from "../js";
import { getFunctionFromTs, getProvider, readJsonFromFile, saveJsonToFile } from "./utils";
import { existsSync, readFileSync } from 'fs';

export const compile = async (
    circuitPath: string,
    options: {
        stats: boolean,
        function?: string,
        outputs?: string,
        chainId?: number | string | bigint,
        provider?: string,
        mock?: boolean,
        cache?: string,
        force?: boolean, // Added force option in the options object
    }
) => {
    console.log("Starting the compile function with options:", options); // Added for debugging
    let circuitFunction = "circuit";
    if (options.function !== undefined) {
        circuitFunction = options.function;
    }
    console.log(`Attempting to get function from TS for circuit function: ${circuitFunction}`); // Additional logging
    const f = await getFunctionFromTs(circuitPath, circuitFunction);
    console.log(`Function retrieved: ${f}`); // Additional logging
    const provider = getProvider(options.provider);
    console.log(`Provider retrieved: ${provider}`); // Additional logging
    const cache: { [key: string]: string } = {};
    if (options.cache !== undefined && existsSync(options.cache)) {
        const cacheJson = readJsonFromFile(options.cache);
        Object.assign(cache, cacheJson);
    }
    console.log(`Cache options processed: ${cache}`); // Additional logging
    const circuit = new AxiomBaseCircuit({
        f: f.circuit,
        mock: options.mock,
        chainId: options.chainId,
        provider,
        shouldTime: options.stats,
        inputSchema: f.inputSchema,
        results: cache,
        capacity: f.config?.capacity,
        config: f.config?.config,
    })
    console.log(`AxiomBaseCircuit instance created`); // Additional logging
    const circuitInputs = f.defaultInputs;
    console.log(`Circuit inputs: ${circuitInputs}`); // Additional logging
    const circuitFn = `const ${f.importName} = AXIOM_CLIENT_IMPORT\n${f.circuit.toString()}`;
    const encoder = new TextEncoder();
    const circuitBuild = encoder.encode(circuitFn);
    const circuitString = Buffer.from(circuitBuild).toString('base64');

    let outfile = path.join(path.dirname(circuitPath), "data", "compiled.json");
    if (options.outputs !== undefined) {
        outfile = options.outputs;
    }
    console.log(`Output file set to: ${outfile}`); // Additional logging

    // Modified the condition to check for the force option
    if (existsSync(outfile) && !options.force) {
        const existingData = JSON.parse(readFileSync(outfile, 'utf8'));
        if (existingData.circuit === circuitString) {
            console.log(`Circuit ${circuitPath} already compiled to ${outfile}`);
            return;
        }
    } else if (options.force) {
        console.log(`--force option used, forcing compilation for ${circuitPath}.`);
    } else {
        console.log(`No existing output file or --force option used, proceeding with compilation for ${circuitPath}.`); // Added for debugging
    }

    console.log("Compiling circuit..."); // Added for debugging
    const res = options.mock ? await circuit.mockCompile(circuitInputs) : await circuit.compile(circuitInputs);
    console.log("Circuit compiled successfully."); // Added for debugging
    const build = {
        ...res,
        circuit: circuitString,
    }

    saveJsonToFile(build, outfile);
    console.log(`Circuit compiled data saved to ${outfile}.`); // Added for debugging

    if (options.cache) {
        saveJsonToFile(circuit.getResults(), options.cache);
        console.log(`Circuit results saved to cache file ${options.cache}.`); // Added for debugging
    }
};

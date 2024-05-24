import * as path from 'path';
import * as fs from 'fs';
import * as ts from 'typescript';
import { execSync } from 'child_process';
import * as vm from 'vm';
import * as os from 'os';
import { extractFunctionInterface } from './parseFunction';

export async function getFunctionFromTs(relativePath: string, functionName: string) {
    const code = fs.readFileSync(path.resolve(relativePath), 'utf8');
    const inputSchema = extractFunctionInterface(code, functionName);
    const result = ts.transpileModule(code, {
        compilerOptions: {
            preserveConstEnums: true,
            keepFunctionNames: true,
            target: ts.ScriptTarget.ESNext,
            module: ts.ModuleKind.CommonJS,
        }
    });
    const pattern: RegExp = /const (\w+) = require\("@axiom-crypto\/(client|circuit)"\);/;
    const match = result.outputText.match(pattern);
    const importName = match ? match[1] : null;
    if (!importName) throw new Error("Could not find import name");
    const script = new vm.Script(result.outputText);
    const customRequire = (moduleName: string) => {
        try {
            if (moduleName === "@axiom-crypto/halo2-lib-js") {
                return require("@axiom-crypto/halo2-lib-js");
            }
            else if (moduleName === "@axiom-crypto/client") {
                return require("../index");
            }
            else if (moduleName === "@axiom-crypto/circuit") {
                return require("../index");
            }
            else {
                const npmRoot = execSync('npm root').toString().trim();
                return require(`${npmRoot}/${moduleName}`);
            }

        } catch (e) {
            throw new Error(`Cannot find module '${moduleName}'.\n Try installing it globally with 'npm install -g ${moduleName}'`);
        }
    };
    const context = vm.createContext({
        exports: {},
        require: customRequire,
        module: module,
        console: console,
        __filename: __filename,
        __dirname: __dirname,
    });
    script.runInContext(context);
    if (!context.exports[functionName]) throw new Error(`File does not export a function called \`${functionName}\`!`);
    if (!context.exports.defaultInputs) {
        if (context.exports.inputs) {
            console.warn("Using `inputs` from circuit file is deprecated. Please export a `defaultInputs` object instead.");
        }
        throw new Error(`File does not export a defaultInputs object!`);
    }
    return {
        circuit: context.exports[functionName],
        inputSchema,
        importName,
        defaultInputs: context.exports.defaultInputs,
        config: context.exports.config,
    };
}

export function getRpcUrl(rpcUrl: string | undefined): string {
    const home = os.homedir();
    const axiomRpcUrlPath = path.join(home, '.axiom', 'rpcUrl.json');
    const folderPath = path.dirname(axiomRpcUrlPath);
    const exists = fs.existsSync(axiomRpcUrlPath);
    if (!exists && !rpcUrl) {
        throw new Error("Must set rpcUrl");
    }
    const rpcUrlToUse = rpcUrl || readJsonFromFile(axiomRpcUrlPath).rpcUrl;
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
    fs.writeFileSync(axiomRpcUrlPath, JSON.stringify({ rpcUrl: rpcUrlToUse }));
    return rpcUrlToUse;
}

export function readInputs(inputsFile: string, circuitInputs: any) {
    console.log(`Reading JSON inputs from: ${inputsFile}`);
    if (fileExists(inputsFile)) {
        circuitInputs = readJsonFromFile(inputsFile);
        return circuitInputs
    }
    if (circuitInputs === undefined) {
        throw new Error("No inputs provided. Either export `inputs` from your circuit file or provide a path to a json file with inputs.");
    }
    console.log(`Reading inputs from circuit file`);
    return circuitInputs;
}

export function saveJsonToFile(json: any, filePath: string) {
    const fullPath = path.resolve(filePath);
    const filename = path.basename(fullPath);
    const folderPath = path.dirname(fullPath);
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
    console.log(`Saved ${filename} to ${filePath}`);
}

export function readJsonFromFile(relativePath: string) {
    return JSON.parse(fs.readFileSync(path.resolve(relativePath), 'utf8'))
}

export function fileExists(relativePath: string) {
    return fs.existsSync(path.resolve(relativePath));
}
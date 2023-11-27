import * as path from 'path';
import * as fs from 'fs';
import * as ts from 'typescript';
import { execSync } from 'child_process';
import * as vm from 'vm';
import * as os from 'os';

export async function getFunctionFromTs(relativePath: string, functionName: string) {
    const code = fs.readFileSync(path.resolve(relativePath), 'utf8');
    const result = ts.transpileModule(code, {
        compilerOptions: { module: ts.ModuleKind.CommonJS }
    });
    const script = new vm.Script(result.outputText);
    const customRequire = (moduleName: string) => {
        try {
            if (moduleName === "@axiom-crypto/halo2-lib-js") {
                return require("@axiom-crypto/halo2-lib-js");
            }
            else if (moduleName === "@axiom-crypto/client-rc") {
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
    let inputs = undefined;
    if (context.exports.inputs) inputs = context.exports.inputs;
    return {
        circuit: context.exports[functionName],
        inputs,
    };
}

export function getProvider(provider: string | undefined): string {
    const home = os.homedir();
    const axiomProviderPath = path.join(home, '.axiom', 'provider.json');
    const folderPath = path.dirname(axiomProviderPath);
    const exists = fs.existsSync(axiomProviderPath);
    if (!exists && !provider) {
        throw new Error("Must set a provider");
    }
    const providerToUse = provider || readJsonFromFile(axiomProviderPath).provider;
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
    fs.writeFileSync(axiomProviderPath, JSON.stringify({ provider: providerToUse }));
    return providerToUse;
}

export function saveJsonToFile(json: any, relativePath: string, name: string) {
    const filePath = path.resolve(relativePath);
    const folderPath = path.dirname(filePath);
    if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
    console.log(`Saved ${name} to ${filePath}`);
}

export function readJsonFromFile(relativePath: string) {
    return JSON.parse(fs.readFileSync(path.resolve(relativePath), 'utf8'))
}
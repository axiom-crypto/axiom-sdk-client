import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

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
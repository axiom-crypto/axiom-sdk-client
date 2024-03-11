import { execSync } from "child_process";
import { existsSync, rmSync } from "fs";
import path from "path";

export async function generateCircuit(circuitPath: string) {
  const circuitFile = path.resolve(`./test/integration/circuits/${circuitPath}.circuit.ts`);
  const compiledPath = path.resolve(`./test/integration/circuits/output/${circuitPath}.compiled.json`);
  const inputsPath = path.resolve(`./test/integration/circuits/${circuitPath}.inputs.json`);
  
  if (existsSync(compiledPath)) {
    rmSync(compiledPath);
  }
  execSync(`node ./dist/cli/index.js circuit compile ${circuitFile} -o ${compiledPath}`, { stdio: 'inherit' });

  let inputs = {};
  if (existsSync(inputsPath)) {
    inputs = (await import(inputsPath)).default;
  }

  return {
    circuit: (await import(circuitFile)).circuit,
    compiledCircuit: await import(compiledPath),
    inputs,
  };
}
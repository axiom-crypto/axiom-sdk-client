import fs from 'fs';
import path from 'path';

export function generateCircuitInputs(file: string, outputPath: string, chainData: any) {
  // Read the entire file content
  const fileContent = fs.readFileSync(file, 'utf8');

  // Split the content by new lines to get an array of lines
  const lines = fileContent.split(/\r?\n/);
  
  // Inputs objects to store
  const inputs: {[key: string]: string} = {};
  const defaultInputs: {[key: string]: string} = {};

  // Iterate over each line and check for your condition
  for (const line of lines) {
    if (line.match(/.*\/\/\$ .*/)) {
      const key = line.split(":")[0].trim().replace(/"/g, '');
      const cmd = line.split("//$")[1].trim();
      if (cmd.includes("chainId")) {
        const chains = cmd.split("=")[1].split(",");
        if (!chains.includes(chainData.chainId)) {
          return;
        }
        continue;
      }
      const idx = extractIndex(cmd);
      const newIdx = idx + 1;
      const value = eval(`chainData.${cmd}`);
      const replacedCmd = cmd.replace(`[${idx}]`, `[${newIdx}]`);
      const defaultValue = eval(`chainData.${replacedCmd}`);
      inputs[key] = value;
      defaultInputs[key] = defaultValue;
    }
  }

  if (Object.keys(inputs).length === 0) {
    return;
  }
  
  // Save inputs files
  const fileName = path.basename(file).split(".")[0];
  fs.mkdirSync(outputPath, { recursive: true });
  const inputsPath = path.join(outputPath, `${fileName}.inputs.json`);
  const defaultInputsPath = path.join(outputPath, `${fileName}.defaultInputs.json`);
  fs.writeFileSync(inputsPath, JSON.stringify(inputs, null, 4));
  fs.writeFileSync(defaultInputsPath, JSON.stringify(defaultInputs, null, 4));
}

export function findCircuitFiles(dir: string): string[] {
  return findCircuitFilesRecursive(dir, []);
}

function findCircuitFilesRecursive(dir: string, circuitFiles: string[]): string[] {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      circuitFiles = findCircuitFilesRecursive(filePath, circuitFiles);
    } else {
      if (file.endsWith('.circuit.ts')) {
        circuitFiles.push(filePath);
      }
    }
  }
  return circuitFiles;
}

function extractIndex(s: string): number {
  const match = s.match(/\[(\d+)\](?![^\[]*"\])/);
  if (match && match[1]) {
    const number = parseInt(match[1], 10);
    return number;
  }
  return -1;
}

/**
 * This script will generate input json files for circuit.ts files in the INPUT_DIR directory.
 * It will use the chainData from CHAINDATA_PATH to generate the input json files. All input 
 * json files will be written to a new folder inside the folder where the circuit.ts file resides 
 * that is the chainId of the file in the CHAINDATA_PATH.
 */
import fs from 'fs';
import path from 'path';

const CHAIN_ID = "11155111";
const INPUT_DIR = "./client/test/integration";
const CHAINDATA_PATH = `./client/test/chainData/${CHAIN_ID}.json`;

function readCircuitFile(chainData: any, file: string) {
  console.log(`Reading file: ${file}`)
  // Read the entire file content
  const fileContent = fs.readFileSync(file, 'utf8');

  // Split the content by new lines to get an array of lines
  const lines = fileContent.split(/\r?\n/);
  
  // Inputs objects to store
  const inputs = {};
  const defaultInputs = {};

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
  const dir = path.dirname(file);
  const fileName = path.basename(file).split(".")[0];
  const chainId = chainData.chainId;
  const newDir = path.join(dir, chainId);
  fs.mkdirSync(newDir, { recursive: true });
  const inputsPath = path.join(newDir, `${fileName}.inputs.json`);
  const defaultInputsPath = path.join(newDir, `${fileName}.defaultInputs.json`);
  fs.writeFileSync(inputsPath, JSON.stringify(inputs, null, 4));
  fs.writeFileSync(defaultInputsPath, JSON.stringify(defaultInputs, null, 4));
  console.log(`Wrote inputs to ${inputsPath}`);
  console.log(`Wrote defaultInputs to ${defaultInputsPath}`);
}

function getFiles(chainData: any, dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      getFiles(chainData, filePath);
    } else {
      if (file.endsWith('.circuit.ts')) {
        readCircuitFile(chainData, filePath);
      }
    }
  }
}

function extractIndex(s: string): number {
  const match = s.match(/\[(\d+)\](?![^\[]*"\])/);
  if (match && match[1]) {
    const number = parseInt(match[1], 10);
    return number;
  }
  return -1;
}

function main() {
  const chainData = JSON.parse(fs.readFileSync(CHAINDATA_PATH, 'utf8'));

  // Recursively read all files in the INPUT_DIR directory
  getFiles(chainData, INPUT_DIR);
}

main();

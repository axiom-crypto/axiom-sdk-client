/**
 * This script will generate input json files for circuit.ts files in the INPUT_DIR directory.
 * It will use the chainData from CHAINDATA_PATH to generate the input json files. All input 
 * json files will be written to a new folder inside the folder where the circuit.ts file resides 
 * that is the chainId of the file in the CHAINDATA_PATH.
 */
import fs from 'fs';
import path from 'path';

const INPUT_DIR = "./client/test/integration";
const CHAINDATA_PATH = "./client/test/chainData/84532.json";

function readCircuitFile(chainData: any, file: string) {
  console.log(`Reading file: ${file}`);
  // Read the entire file content
  const fileContent = fs.readFileSync(file, 'utf8');

  // Split the content by new lines to get an array of lines
  const lines = fileContent.split(/\r?\n/);
  
  // Convert to an object
  const inputs = {};

  // Iterate over each line and check for your condition
  for (const line of lines) {
    if (line.match(/.*\/\/\$ .*/)) {
      const key = line.split(":")[0].trim();
      const valueLookup = line.split("//$")[1].trim();
      const value = eval(`chainData.${valueLookup}`);
      console.log(key, valueLookup, value);
      inputs[key] = value;
    }
  }

  if (Object.keys(inputs).length === 0) {
    return;
  }
  
  // Get current directory of file
  const dir = path.dirname(file);
  const fileName = path.basename(file).split(".")[0];
  const chainId = chainData.chainId;
  const newDir = path.join(dir, chainId);
  fs.mkdirSync(newDir, { recursive: true });
  fs.writeFileSync(path.join(newDir, `${fileName}.inputs.json`), JSON.stringify(inputs, null, 4));
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

function main() {
  const chainData = JSON.parse(fs.readFileSync(CHAINDATA_PATH, 'utf8'));
  
  // Recursively read all files in the INPUT_DIR directory
  getFiles(chainData, INPUT_DIR);
}

main();

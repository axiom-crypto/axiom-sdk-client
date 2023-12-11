import fs from 'fs';
import path from 'path';

const getCircuitInterfaceFromInput = (inputs: string) => {
  let inputNames = inputs.split("\n").map((line) => line.split(":")[0].trim());
  let inputTypes = inputs.split("\n").map((line) => line.split(":")[1].trim());
  let circuitValueTypes: string[] = [];
  for (let val of inputTypes) {
    if (Array.isArray(val)) {
      if (String(val[0]).length == 66) {
        circuitValueTypes.push("CircuitValue256[]");
      }
      else {
        circuitValueTypes.push("CircuitValue[]");
      }
    }
    else if (String(val).length == 66) {
      circuitValueTypes.push("CircuitValue256");
    }
    else {
      circuitValueTypes.push("CircuitValue");
    }
  }
  let newInputs = inputNames.map((name, i) => `  ${name}: ${circuitValueTypes[i]}`).join(";\n").concat(";");
  return newInputs;
}

export const buildCircuit = (circuitPath: string): string => {
  // Parse path
  let [parsedPath, parsedFilename] = circuitPath.split("input/")[1].split("/");
  parsedFilename = parsedFilename.split(".js")[0] + ".circuit.ts";

  // Load the input circuit and template
  let circuit = fs.readFileSync(path.resolve(__dirname, "template.circuit.ts")).toString();
  let inputCircuit = fs.readFileSync(path.resolve(circuitPath)).toString();

  // Check if inputCircuit defines an input object
  let inputObject = inputCircuit.match(/const input = {[\s\S]*}/);
  if (inputObject) {
    // Split out extraneous lines in input
    let inputs = inputObject[0].split("\n").slice(1, -1).join("\n");

    // Replace the input object in the template with the input object from the input circuit
    circuit = circuit.replace("  // $input", inputs);

    // Remove the input object from the input circuit
    inputCircuit = inputCircuit.replace(inputObject[0], "");

    // Get input types
    const circuitValueInputs = getCircuitInterfaceFromInput(inputs);
    circuit = circuit.replace("  // $typeInputs", circuitValueInputs);

    let inputNames = inputs.split("\n").map((line) => line.split(":")[0]).join(",\n");
    circuit = circuit.replace("  // $cvInputs", inputNames);
  }

  // Add the input circuit to the circuit template
  circuit = circuit.replace("  // $circuit", "\n" + inputCircuit);
  
  // Write the output file
  const outpath = path.resolve(__dirname, "../output", parsedPath);
  const outFilePath = path.resolve(outpath, parsedFilename);
  fs.mkdirSync(path.resolve(outpath), { recursive: true });
  fs.writeFileSync(outFilePath, circuit);

  return outFilePath;
}
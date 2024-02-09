import fs from 'fs';
import path from 'path';

const parseStringToObject = (str: string) => {
  const inputVars = str.split(":").slice(0, -1).map((line) => line.split(" ").slice(-1)[0]);
  for (const inputVar of inputVars) {
    str = str.replace(inputVar, `"${inputVar}"`);
  }
  let parsed = str.replace(/ /g, "").replace(/\n/g, "");
  parsed = parsed.replace(/;/g, "");
  parsed = parsed.replace(/,\]/g, "]");
  parsed = parsed.replace(/,\}/g, "}");
  return JSON.parse(parsed);
}

const getCircuitInterfaceFromInput = (jsonInput: object) => {
  const keys = Object.keys(jsonInput);
  const values = Object.values(jsonInput);
  let inputTypes: string[] = [];
  for (let i = 0; i < keys.length; i++) {
    let inputType = "";
    if (Array.isArray(values[i])) {
      // Check if any array value is a 32-byte string and if so it should be a CircuitValue256
      const contains32ByteString = values[i].reduce((acc: boolean, value: any) => acc && (String(value).length === 66), false);
      inputType = contains32ByteString ? "CircuitValue256[]" : "CircuitValue[]";
    } else {
      if (String(values[i]).length == 66) {
        inputType = "CircuitValue256";
      } else {
        inputType = "CircuitValue";
      }
    }
    inputTypes.push(`  ${keys[i]}: ${inputType};`);
  }
  return inputTypes.join("\n");
}

export const buildCircuit = (jsCircuitPath: string) => {
  // Parse path
  let parsedFilename = path.basename(jsCircuitPath);
  parsedFilename = parsedFilename.split(".js")[0] + ".circuit.ts";

  // Load the input circuit and template
  let circuit = fs.readFileSync(path.resolve(__dirname, "template.circuit")).toString();
  let inputCircuit = fs.readFileSync(path.resolve(jsCircuitPath)).toString();

  let inputs: any;

  // Check if inputCircuit defines an input object
  let inputObject = inputCircuit.match(/const input = {[\s\S]*}[;]*/);
  if (inputObject) {
    // Split out extraneous lines in input
    inputs = parseStringToObject(inputObject[0].split("const input = ")[1]);//inputObject[0].split("\n").slice(1, -1).join("\n");
    console.log("inputs", inputs);

    // Replace the input object in the template with the input object from the input circuit
    circuit = circuit.replace("  // $input", JSON.stringify(inputs, null, 2).slice(2, -2));

    // Remove the input object from the input circuit
    inputCircuit = inputCircuit.replace(inputObject[0], "");

    // Get input types
    const circuitValueInputs = getCircuitInterfaceFromInput(inputs);
    circuit = circuit.replace("  // $typeInputs", circuitValueInputs);

    // Get circuitvalue input names
    let inputNames = Object.keys(inputs).map((input) => `  ${input},`).join("\n");
    circuit = circuit.replace("  // $cvInputs", inputNames);
  }

  // Add the tabbed input circuit to the circuit template
  circuit = circuit.replace("  // $circuit", "\n  " + inputCircuit.replace(/\n/g, "\n  "));

  // Get template imports
  let imports = circuit.match(/import {[\s\S]*} from "@axiom-crypto\/client";/);
  if (!imports) {
    throw new Error("Could not find imports in circuit");
  }
  let importArray = imports[0].split("\n").slice(1, -1).map((line) => line.trim().split(",")[0]);

  // Check which imports are used in the input circuit
  importArray = importArray.filter((imp) => {
    if (imp == "CircuitValue" || imp == "CircuitValue256") {
      return true;
    }
    return inputCircuit.includes(imp);
  });
  const usedImports = `import {\n${importArray.join(",\n").concat(",")}\n} from "@axiom-crypto/client";`;

  // Replace template imports with used imports
  circuit = circuit.replace(imports[0], usedImports);

  if (inputs == undefined) {
    inputs = {};
  }
  return { circuit, inputs };
}
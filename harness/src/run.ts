import { buildCircuit } from "./template/buildCircuit";
import path from 'path';
import fs from 'fs';
import { compile, run as circuitRun } from "@axiom-crypto/client/cli/components";

export const run = async (
  inputPath: string,
  options: {
    output: string,
    function: string,
    provider?: string,
  }
) => {
  const fileName = inputPath.split("/").slice(-1)[0].split(".js")[0];
  const outputFileBase = `${options.output}/${fileName}`;

  // Build the typescript circuit
  const circuit = buildCircuit(inputPath);
  const circuitPath = path.resolve(`${outputFileBase}.circuit.ts`);

  // Write the typescript circuit
  fs.mkdirSync(path.resolve(options.output), { recursive: true });
  fs.writeFileSync(circuitPath, circuit);

  // Compile the circuit
  const buildFile = `${outputFileBase}.build.json`;
  await compile(
    circuitPath, 
    {
      stats: false,
      function: options.function,
      output: buildFile,
      provider: options.provider,
    }
  );

  // Run the circuit
  const outputFile = `${outputFileBase}.output.json`;
  await circuitRun(
    circuitPath, 
    {
      stats: false,
      build: buildFile,
      function: options.function,
      output: outputFile,
      provider: options.provider,
    }
  );
};

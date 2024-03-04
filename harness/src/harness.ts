import { buildCircuit } from "./template/buildCircuit";
import path from 'path';
import fs from 'fs';
import { compile, prove } from "@axiom-crypto/client/cli/components";

export const harness = async (
  inputPath: string,
  options: {
    outputs: string;
    function: string;
    chainId?: number | string | bigint;
    provider?: string;
    skipProve?: boolean;
  }
) => {
  const fileName = path.basename(inputPath).split(".js")[0];
  const outputsFileBase = `${options.outputs}/${fileName}`;

  // Build the typescript circuit
  const circuit = buildCircuit(inputPath);
  const circuitPath = path.resolve(`${outputsFileBase}.circuit.ts`);

  // Write the typescript circuit
  fs.mkdirSync(path.resolve(options.outputs), { recursive: true });
  fs.writeFileSync(circuitPath, circuit.circuit);

  // Write the inputs
  const inputsFile = `${outputsFileBase}.inputs.json`;
  fs.writeFileSync(inputsFile, JSON.stringify(circuit.inputs, null, 2));

  // Compile the circuit
  const compiledFile = `${outputsFileBase}.compiled.json`;
  await compile(
    circuitPath,
    {
      stats: false,
      function: options.function,
      outputs: compiledFile,
      chainId: options.chainId,
      provider: options.provider,
    }
  );

  if (options.skipProve) return;

  // Prove the circuit
  const outputsFile = `${outputsFileBase}.proven.json`;
  await prove(
    compiledFile,
    inputsFile,
    {
      stats: false,
      outputs: outputsFile,
      chainId: options.chainId,
      provider: options.provider,
    }
  );
};

import { buildCircuit } from "./template/buildCircuit";
import util from 'node:util';
import path from 'node:path';
import fs from 'fs';
import { compile, run as circuitRun } from "@axiom-crypto/client/cli/components";
const exec = util.promisify(require('node:child_process').exec);

export const run = async (
  inputPath: string,
  options: {
    output: string,
    function: string,
  }
) => {
  console.log(inputPath);
  console.log(options);
  console.log("Building circuit parameters:", inputPath);
  const fileName = inputPath.split("/").slice(-1)[0].split(".js")[0];
  const outputFileBase = `${options.output}/${fileName}`;

  console.log("Output file base:", outputFileBase);

  // Build the typescript circuit
  const circuit = buildCircuit(inputPath);
  const circuitPath = path.resolve(`${outputFileBase}.circuit.ts`);

  // Write the typescript circuit
  fs.mkdirSync(path.resolve(options.output), { recursive: true });
  fs.writeFileSync(circuitPath, circuit);

  // Compile the circuit
  const buildFile = `${outputFileBase}.build.json`;
  // const compileCmd = `npx axiom compile "${circuitPath}" --function ${options.function} --output "${buildFile}" --provider $PROVIDER_URI_GOERLI`;
  // const { stdout, stderr: compileStdErr } = await exec(compileCmd);
  // if (compileStdErr) {
  //   console.log("Failed on compile command:", compileCmd);
  //   throw new Error(`Compile error: ${compileStdErr}`);
  // }
  console.log("CircuitPath", circuitPath);
  await compile(
    circuitPath, 
    {
      stats: false,
      function: options.function,
      output: buildFile,
    }
  );

  // Run the circuit
  const outputFile = `${outputFileBase}.output.json`;
  // const runCmd = `npx axiom run "${circuitPath}" --function ${options.function} --build "${buildFile}" --output "${outputFile}" --provider $PROVIDER_URI_GOERLI`;
  // const { stderr: runStdErr } = await exec(runCmd);
  // if (runStdErr) {
  //   console.log("Failed on run command:", runCmd);
  //   throw new Error(`Run error: ${runStdErr}`);
  // }
  await circuitRun(
    circuitPath, 
    {
      stats: false,
      build: buildFile,
      function: options.function,
      output: outputFile,
    }
  );
};

import { buildCircuit } from "./template/buildCircuit";
import util from 'node:util';
import fs from 'fs';
import { listDir, makeFileMap } from "./template/utils";

const exec = util.promisify(require('node:child_process').exec);

describe("Run", () => {
  if (process.env.PROVIDER_URI_GOERLI == undefined) {
    throw new Error("`PROVIDER_URI_GOERLI` environment variable must be defined");
  }

  const files = listDir("./integration/input/");
  const fileMap = makeFileMap(files);

  for (let [folder, files] of Object.entries(fileMap)) {
    for (let file of files) {
      const inputFile = `./integration/input/${folder}/${file}`;
      const fileName = file.split(".js")[0];
      const outputFileBase = `./integration/output/${folder}/${fileName}`;
      test(`Test ${folder}: ${inputFile}`, async () => {
        console.log(`Running test: ${inputFile}`)

        // Build the circuit
        const circuitPath = buildCircuit(inputFile);

        // Compile the circuit
        const buildFile = `${outputFileBase}.build.json`;
        const compileCmd = `npx axiom compile "${circuitPath}" --function circuit --output "${buildFile}" --provider $PROVIDER_URI_GOERLI`;
        const { stdout, stderr: compileStdErr } = await exec(compileCmd);
        if (compileStdErr) {
          console.log("Failed on compile command:", compileCmd);
          throw new Error(`Compile error: ${compileStdErr}`);
        }

        // Check build file exists
        expect(fs.existsSync(buildFile)).toBe(true);

        // Run the circuit
        const outputFile = `${outputFileBase}.output.json`;
        const runCmd = `npx axiom run "${circuitPath}" --function circuit --build "${buildFile}" --output "${outputFile}" --provider $PROVIDER_URI_GOERLI`;
        const { stderr: runStdErr } = await exec(runCmd);
        if (runStdErr) {
          console.log("Failed on run command:", runCmd);
          throw new Error(`Run error: ${runStdErr}`);
        }

        // Check output file exists
        expect(fs.existsSync(outputFile)).toBe(true);
      }, 180000);
    }
  }
});
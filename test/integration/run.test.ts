import { buildCircuit } from "./template/buildCircuit";
import util from 'node:util';
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
        const compileCmd = `pnpm axiom compile "${circuitPath}" --function circuit --output "${outputFileBase}.build.json" --provider $PROVIDER_URI_GOERLI`;
        const { stderr: compileStdErr } = await exec(compileCmd);
        if (compileStdErr) {
          console.log("Failed on compile command:", compileCmd);
          throw new Error(`Compile error: ${compileStdErr}`);
        }

        // Run the circuit
        const runCmd = `pnpm axiom run "${circuitPath}" --function circuit --build "${outputFileBase}.build.json" --output "${outputFileBase}.output.json" --provider $PROVIDER_URI_GOERLI`;
        const { stderr: runStdErr } = await exec(runCmd);
        if (runStdErr) {
          console.log("Failed on run command:", runCmd);
          throw new Error(`Run error: ${runStdErr}`);
        }
      }, 100000);
    }
  }

  // test("Test account", async () => {
  //   const circuitPath = buildCircuit("./integration/input/account/7_balance.js");

  //   try {
  //     const { stdout, stderr } = await exec("pnpm axiom compile ./integration/output/account/7_balance.circuit.ts --function circuit --output ./integration/output/account/7_balance.build.json --provider $PROVIDER_URI_GOERLI");
  //     // console.log("stdout", stdout);
  //     // console.log("stderr", stderr);
  //   } catch (e) {
  //     console.log(e);
  //   }
  // });
});
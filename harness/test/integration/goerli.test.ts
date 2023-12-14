import fs from 'fs';
import { listDir, makeFileMap } from "../utils";
import { run } from "../../src/run";

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
      const outputFolder = `./integration/output/${folder}`;
      const outputFileBase = `${outputFolder}/${fileName}`;

      test(`Test ${folder}: ${inputFile}`, async () => {
        console.log(`Running test: ${inputFile}`)

        // Run the circuit
        await run(
          inputFile,
          {
            output: outputFolder,
            function: "circuit",
            provider: process.env.PROVIDER_URI_GOERLI,
          }
        );

        // Check build file exists
        const buildFile = `${outputFileBase}.build.json`;
        expect(fs.existsSync(buildFile)).toBe(true);

        // Check output file exists
        const outputFile = `${outputFileBase}.output.json`;
        expect(fs.existsSync(outputFile)).toBe(true);
      }, 180000);
    }
  }
});
import fs from 'fs';
import path from 'path';
import { listDir, makeFileMap } from "../utils";
import { harness } from "../../src/harness";

describe("Goerli unit tests", () => {
  if (process.env.PROVIDER_URI_GOERLI === undefined) {
    throw new Error("`PROVIDER_URI_GOERLI` environment variable must be defined");
  }

  const inputBasePath = path.resolve("./test/circuits/goerli/input");
  const outputBasePath = path.resolve("./test/unit/goerli/output");
  const files = listDir(inputBasePath);
  const fileMap = makeFileMap(files);

  // Delete output files
  fs.rmSync(outputBasePath, { recursive: true, force: true });

  for (let [folder, files] of Object.entries(fileMap)) {
    for (let file of files) {
      const inputFile = `${inputBasePath}/${folder}/${file}`;
      const fileName = file.split(".js")[0];
      const outputBasePathType = `${outputBasePath}/${folder}`;
      const outputFileBase = `${outputBasePathType}/${fileName}`;

      test(`Test ${folder}: ${inputFile}`, async () => {
        console.log(`Running test: ${inputFile}`)

        // Run the circuit
        await harness(
          inputFile,
          {
            outputs: outputBasePathType,
            function: "circuit",
            chainId: "5",
            provider: process.env.PROVIDER_URI_GOERLI,
          }
        );

        // Check build file exists
        const buildFile = `${outputFileBase}.compiled.json`;
        expect(fs.existsSync(buildFile)).toBe(true);

        // Check output file exists
        const outputFile = `${outputFileBase}.proven.json`;
        expect(fs.existsSync(outputFile)).toBe(true);
      }, 180000);
    }
  }
});
import fs from 'fs';
import { listDir, makeFileMap } from "../utils";
import { harness } from "../../src/harness";

describe("Sepolia tests", () => {
  if (process.env.PROVIDER_URI_SEPOLIA == undefined) {
    throw new Error("`PROVIDER_URI_SEPOLIA` environment variable must be defined");
  }

  const inputBasePath = "./test/integration/sepolia/input";
  const outputBasePath = "./test/integration/sepolia/output";
  const files = listDir(inputBasePath);
  const fileMap = makeFileMap(files);

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
            output: outputBasePathType,
            function: "circuit",
            provider: process.env.PROVIDER_URI_SEPOLIA,
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
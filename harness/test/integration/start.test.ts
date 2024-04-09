import path from 'path';
import { findCircuitFiles, run } from "../../src/run";
import { rmSync } from 'fs';

if (process.env.CHAIN_ID === undefined) {
  throw new Error(`CHAIN_ID environment variable must be defined`);
}
const CHAIN_ID = process.env.CHAIN_ID;

// NOTE: Requires unit tests to be run first since the unit tests build the circuit parameter json files
describe("Send Sepolia queries on-chain", () => {
  if (process.env[`PROVIDER_URI_${CHAIN_ID}`] === undefined) {
    throw new Error(`PROVIDER_URI_${CHAIN_ID} environment variable must be defined`);
  }
  if (process.env[`PRIVATE_KEY_${CHAIN_ID}`] === undefined) {
    throw new Error(`PRIVATE_KEY_${CHAIN_ID} environment variable must be defined`);
  }

  const circuitPaths = findCircuitFiles("./test/integration/circuits");
  console.log(circuitPaths);

  beforeAll(async () => {
    rmSync("./test/integration/circuits/output", { recursive: true, force: true });
  })

  test("Run tests", async () => {
    for await (const circuitPath of circuitPaths) {
      const folder = path.basename(path.dirname(circuitPath));
      const filename = path.basename(circuitPath);
      // test(`Test ${folder}/${filename}`, async () => {
        const receipt = await run({
          circuit: circuitPath,
          provider: process.env[`PROVIDER_URI_${CHAIN_ID}`] as string,
          data: `./test/integration/chainData/${CHAIN_ID}.json`,
          send: true,
        })
        expect(receipt.status).toEqual("success");
      // }, 180000);
    }
  }, 180000);
});
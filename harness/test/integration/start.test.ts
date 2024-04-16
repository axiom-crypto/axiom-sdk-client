import path from 'path';
import { findCircuitFiles, run } from "../../src/run";
import { rmSync } from 'fs';

if (process.env.CHAIN_ID === undefined) {
  throw new Error(`CHAIN_ID environment variable must be defined`);
}
const CHAIN_ID = process.env.CHAIN_ID;

jest.setTimeout(180000);

// Special tests need to be run with specific parameters
const SPECIAL_TESTS = [
  "size129Header.circuit.ts",
  "simpleWithCapacity.circuit.ts",
  "eip4844receipt.circuit.ts",
]

// NOTE: A valid data file in the `test/chainData` directory must be provided
describe("Integration tests", () => {
  if (process.env[`PROVIDER_URI_${CHAIN_ID}`] === undefined) {
    throw new Error(`PROVIDER_URI_${CHAIN_ID} environment variable must be defined`);
  }
  if (process.env[`PRIVATE_KEY_${CHAIN_ID}`] === undefined) {
    throw new Error(`PRIVATE_KEY_${CHAIN_ID} environment variable must be defined`);
  }

  const circuitPaths = findCircuitFiles("./test/integration/circuits");
  let standardTests: string[] = [];
  for (const circuitPath of circuitPaths) {
    const filename = path.basename(circuitPath);
    if (!SPECIAL_TESTS.includes(filename)) {
      standardTests.push(circuitPath);
    }
  }

  const provider = process.env[`PROVIDER_URI_${CHAIN_ID}`] as string;
  const data = `./test/chainData/${CHAIN_ID}.json`;

  beforeAll(async () => {
    rmSync("./test/integration/circuits/output", { recursive: true, force: true });
  })

  for (const circuitPath of standardTests) {
    const folder = path.basename(path.dirname(circuitPath));
    const filename = path.basename(circuitPath);
    test(`Test ${folder}/${filename}`, async () => {
      const receipt = await run({
        circuit: circuitPath,
        provider,
        data,
        send: true,
      })
      expect(receipt.status).toEqual("success");
    });
  }

  test(`Size 129 header`, async () => {
    const testFn = async () => {
      await run({
        circuit: "./test/integration/circuits/capacityDataQuery/size129Header.circuit.ts",
        provider,
        data,
        send: true,
      });
    }
    await expect(testFn()).rejects.toThrowError();
  });

  test(`Custom capacity (256)`, async () => {
    const receipt = await run({
      circuit: "./test/integration/circuits/computeQuery/simpleWithCapacity.circuit.ts",
      provider,
      data,
      send: true,
      options: { 
        capacity: {
          maxOutputs: 256,
          maxSubqueries: 256,
        },
      },
    });
    expect(receipt.status).toEqual("success");
  });

  test(`EIP4844`, async () => {
    if (!(CHAIN_ID === "1" || CHAIN_ID === "11155111")) {
      return;
    }
    const testFn = async () => {
      await run({
        circuit: "./test/integration/circuits/eip4844/eip4844receipt.circuit.ts",
        provider,
        data,
        send: true,
      });
    }
    await expect(testFn()).rejects.toThrowError();
  });
});
import path from 'path';
import { findCircuitFiles, run, generateInputs, compile, proveSendQuery } from "../../src/run";
import { rmSync } from 'fs';

if (process.env.CHAIN_ID === undefined) {
  throw new Error(`CHAIN_ID environment variable must be defined`);
}
const CHAIN_ID = process.env.CHAIN_ID;
const TARGET_CHAIN_ID = process.env.TARGET_CHAIN_ID || undefined;
const TARGET_RPC_URL = process.env[`RPC_URL_${TARGET_CHAIN_ID}`] || undefined;

jest.setTimeout(240000);

// Special tests need to be run with specific parameters
const SPECIAL_TESTS = [
  "size129Header.circuit.ts",
  "simpleWithCapacity.circuit.ts",
  "eip4844receipt.circuit.ts",
]

// NOTE: A valid data file in the `test/chainData` directory must be provided
describe("Integration tests", () => {
  if (process.env[`RPC_URL_${CHAIN_ID}`] === undefined) {
    throw new Error(`RPC_URL_${CHAIN_ID} environment variable must be defined`);
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

  const rpcUrl = process.env[`RPC_URL_${CHAIN_ID}`] as string;
  const data = `./test/chainData/${CHAIN_ID}.json`;

  beforeAll(async () => {
    rmSync("./test/integration/circuits/output", { recursive: true, force: true });
  })

  for (const circuitPath of standardTests) {
    const folder = path.basename(path.dirname(circuitPath));
    const filename = path.basename(circuitPath).split(".")[0];
    test(`Test ${folder}/${filename}`, async () => {
      /*
        // Run a test via component functions
        await generateInputs(
          circuitPath,
          `./test/integration/circuits/output`,
          `./test/chainData/${CHAIN_ID}.json`
        );
        await compile(
          rpcUrl,
          circuitPath,
          `./test/integration/circuits/output`,
          `./test/integration/circuits/output`
        );
        const receipt = await proveSendQuery(
          CHAIN_ID,
          rpcUrl,
          circuitPath,
          `./test/integration/circuits/output/${filename}.compiled.json`,
          `./test/integration/circuits/output/${filename}.inputs.json`
        );
      */

      // Run a test via standard `run` method
      const [axiom, receipt] = await run({
        circuit: circuitPath,
        rpcUrl,
        targetRpcUrl: TARGET_RPC_URL,
        data,
        send: true,
      })
      console.log(receipt);
      expect(axiom.getSendQueryArgs !== undefined).toBe(true);
      expect(receipt.status).toEqual("success");
    });
  }

  test(`Size 129 header`, async () => {
    const testFn = async () => {
      await run({
        circuit: "./test/integration/circuits/capacityDataQuery/size129Header.circuit.ts",
        rpcUrl,
        targetRpcUrl: TARGET_RPC_URL,
        data,
        send: true,
      });
    }
    await expect(testFn()).rejects.toThrowError();
  });

  test(`Custom capacity (256)`, async () => {
    const [axiom, receipt] = await run({
      circuit: "./test/integration/circuits/computeQuery/simpleWithCapacity.circuit.ts",
      rpcUrl,
      targetRpcUrl: TARGET_RPC_URL,
      data,
      send: true,
      options: {
        capacity: {
          maxOutputs: 256,
          maxSubqueries: 256,
        },
      },
    });
    console.log(receipt);
    expect(axiom.getSendQueryArgs !== undefined).toBe(true);
    expect(receipt.status).toEqual("success");
  });

  test(`EIP4844`, async () => {
    if (!(CHAIN_ID === "1" || CHAIN_ID === "11155111")) {
      return;
    }
    const testFn = async () => {
      await run({
        circuit: "./test/integration/circuits/eip4844/eip4844receipt.circuit.ts",
        rpcUrl,
        targetRpcUrl: TARGET_RPC_URL,
        data,
        send: true,
      });
    }
    await expect(testFn()).rejects.toThrowError();
  });
});
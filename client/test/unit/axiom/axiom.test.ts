import { Axiom } from "../../../src/axiom/axiom";
import { convertInputArgsToSchemaString } from "../../../src/axiom/utils";
import { circuit } from '../circuits/average.circuit';
import compiledCircuit from '../circuits/compiled.json';

describe("Axiom tests", () => {
  test("validate input schema transform", async () => {
    let inputSchema = convertInputArgsToSchemaString({
      claimedBlockNumber: "uint32",
      abort: "bytes32",
      argo: "int224[]",
      test: "uint256[]",
    });
    let expectedOutput = '{\n  "claimedBlockNumber": "CircuitValue",\n  "abort": "CircuitValue256",\n  "argo": "CircuitValue[]",\n  "test": "CircuitValue256[]"\n}';
    expect(inputSchema).toEqual(expectedOutput);

    inputSchema = convertInputArgsToSchemaString({
      blockNumber: "uint32",
      address: "address",
    });
    expectedOutput = '{\n  "blockNumber": "CircuitValue",\n  "address": "CircuitValue"\n}';
    expect(inputSchema).toEqual(expectedOutput);
  });

  // test("send transaction", async () => {
  //   const input = {
  //     blockNumber: 5000000,
  //     address: "0xEaa455e4291742eC362Bc21a8C46E5F2b5ed4701"
  //   };

  //   const axiom = new Axiom({
  //     circuit: circuit,
  //     compiledCircuit: compiledCircuit,
  //     inputArgs: {
  //       blockNumber: "uint32",
  //       address: "address",
  //     },
  //     chainId: "11155111",  // Sepolia
  //     provider: process.env.PROVIDER_URI_SEPOLIA as string,
  //     privateKey: process.env.PRIVATE_KEY_SEPOLIA as string,
  //     mock: false,
  //   });
  //   await axiom.init();
  //   const args = await axiom.prove(input);
  //   const receipt = await axiom.sendQuery(args);
  //   console.log("Transaction receipt:", receipt);
  // }, 60000);
});
import fs from 'fs';
import path from 'path';
import { ethers } from 'ethers';
import { listDir, makeFileMap } from "../utils";
import { harness } from "../../src/harness";
import { queryParams } from '../../../client/src/cli/queryParams';
import { AxiomCircuit } from "../../../client/src/js";

// TMP: until we expose abi (via Axiom) in AxiomCircuit
import axiomV2QueryJson from "./tmpAbi/AxiomV2Query.json";
// TMP: until we expose query addr (via Axiom) in AxiomCircuit
const axiomV2QueryAddr = "0x8ec7b212a983b1ebbfacfd69794ef179da1db0e0";

// NOTE: Requires unit tests to be run first since the unit tests build the circuit parameter json files
describe("Send Sepolia queries on-chain", () => {
  if (process.env.PROVIDER_URI_SEPOLIA === undefined) {
    throw new Error("`PROVIDER_URI_SEPOLIA` environment variable must be defined");
  }
  if (process.env.PRIVATE_KEY_SEPOLIA === undefined) {
    throw new Error("`PRIVATE_KEY_SEPOLIA` environment variable must be defined");
  }

  const provider = new ethers.JsonRpcProvider(
    process.env.PROVIDER_URI_SEPOLIA as string,
  );
  const signer = new ethers.Wallet(
    process.env.PRIVATE_KEY_SEPOLIA as string,
    provider,
  );
  const senderAddress = signer.address;

  const inputBasePath = "./test/circuits/sepolia/input";
  const outputBasePath = "./test/integration/sepolia/output";
  const files = listDir(inputBasePath);
  const fileMap = makeFileMap(files);
  const exampleClientAddr = "0x752056074aceabac231801cbfa68900744eebc98";

  for (let [folder, files] of Object.entries(fileMap)) {
    for (let file of files) {
      const inputFile = `${inputBasePath}/${folder}/${file}`;
      const fileName = file.split(".js")[0];
      const outputBasePathType = `${outputBasePath}/${folder}`;
      const outputFileBase = `${outputBasePathType}/${fileName}`;

      test(`Test ${folder}: ${inputFile}`, async () => {
        const unitTestFilePath = path.resolve("test/unit/sepolia/output", folder, fileName);
        const sendQueryJsonPath = path.resolve(outputBasePathType, `${fileName}.sendQuery.json`);

        await queryParams(
          exampleClientAddr,
          {
            refundAddress: senderAddress,
            sourceChainId: "11155111",
            callbackExtraData: ethers.ZeroHash,
            calldata: false,
            caller: senderAddress,
            inputs: `${unitTestFilePath}.output.json`,
            outputs: sendQueryJsonPath,
            provider: process.env.PROVIDER_URI_SEPOLIA as string,
            maxFeePerGas: "50000000000", // need to set this on Sepolia since the network is busy
          }
        );

        const sendQueryJson = require(sendQueryJsonPath);

        const axiomV2QueryMock = new ethers.Contract(
          axiomV2QueryAddr,
          axiomV2QueryJson.abi,
          signer,
        );
      
      
        console.log(
          "Sending a Query to AxiomV2QueryMock with payment amount (wei):",
          sendQueryJson.value,
        );
      
        const tx = await axiomV2QueryMock.sendQuery(...sendQueryJson.args, { value: sendQueryJson.value });
        const receipt: ethers.ContractTransactionReceipt = await tx.wait();
        console.log("Transaction receipt:", receipt);
      }, 180000);
    }
  }
});
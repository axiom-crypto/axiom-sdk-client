import { circuit, CircuitInputs } from "./circuits/sendQuery/average.circuit";
import { Axiom } from "../../src";
import inputs from './circuits/sendQuery/average.inputs.json';
import compiledCircuit from './circuits/sendQuery/average.compiled.json';
import { UserInput } from "@axiom-crypto/circuit";
import { PinataIpfsClient } from "@axiom-crypto/core";
import { ByteStringReader, decodeFullQueryV2 } from "@axiom-crypto/core/packages/tools";
import { getQueryHashV2, getDataQueryHashFromSubqueries } from "@axiom-crypto/tools";

describe("Send Query using Axiom client", () => {
  test("Send a query with IPFS", async () => {
    const ipfsClient = new PinataIpfsClient(process.env.PINATA_JWT as string);

    const axiom = new Axiom({
      circuit: circuit,
      compiledCircuit: compiledCircuit,
      chainId: "11155111",  // Sepolia
      provider: process.env.PROVIDER_URI_SEPOLIA as string,
      privateKey: process.env.PRIVATE_KEY_SEPOLIA as string,
      callback: {
        target: "0x4A4e2D8f3fBb3525aD61db7Fc843c9bf097c362e",
      },
      ipfsClient: ipfsClient,
    });
    await axiom.init();
    await axiom.prove(inputs as UserInput<CircuitInputs>);
    if (!process.env.PRIVATE_KEY_SEPOLIA) {
      console.log("No private key provided: Query will not be sent to the blockchain.");
      return;
    }
    const receipt = await axiom.sendQueryWithIpfs();
    expect(receipt.status).toBe('success');

    // Get the IPFS hash from the logs
    const logData = receipt.logs[1].data;
    const bsr = new ByteStringReader(logData);
    bsr.readBytes(32); // skip the first 32 bytes
    const ipfsHash = bsr.readBytes(32);

    // Read the data posted on IPFS and decode it
    const pinata = new PinataIpfsClient(process.env.PINATA_JWT);
    const readRes = await pinata.read(ipfsHash);
    if (readRes.status - 200 > 99) {
      throw new Error("Failed to read data from IPFS");
    }
    console.log(readRes);
    const decoded = decodeFullQueryV2(readRes.value as string);
    if (!decoded) {
      throw new Error("Failed to decode the data from IPFS");
    }
    // const = decoded?.sourceChainId
    const dataQueryHash = getDataQueryHashFromSubqueries(decoded.dataQuery.sourceChainId, decoded.dataQuery.subqueries);
    const queryHash = getQueryHashV2(decoded.sourceChainId, dataQueryHash, decoded.computeQuery);

    const sendQueryArgs = axiom.getSendQueryArgs();
    if (!sendQueryArgs) {
      throw new Error("Failed to get sendQueryArgs");
    }

    expect(queryHash).toEqual(sendQueryArgs.args[0]);
  }, 90000);
});

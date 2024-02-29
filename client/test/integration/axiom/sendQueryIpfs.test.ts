import { circuit, CircuitInputs } from "../circuit/average.circuit";
import { Axiom } from "../../../src/";
import inputs from '../circuit/average.inputs.json';
import compiledCircuit from '../circuit/average.compiled.json';
import { RawInput } from "@axiom-crypto/circuit/types";
import { ByteStringReader, decodeFullQueryV2 } from "@axiom-crypto/core/packages/tools";
import { PinataIpfsClient } from "../../../src/lib/ipfs";

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
    const computeQuery = await axiom.prove(inputs as RawInput<CircuitInputs>);
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
    const rawIpfsData = await pinata.read(ipfsHash);
    if (!rawIpfsData) {
      throw new Error("Failed to read data from IPFS");
    }
    console.log(rawIpfsData);
    const decoded = decodeFullQueryV2(rawIpfsData);
    expect(decoded?.computeQuery).toEqual(computeQuery);
  }, 60000);
});

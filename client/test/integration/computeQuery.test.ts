
import { Axiom } from "../../src";
import { generateCircuit, getTarget, parseArgs, runTestPass } from "./circuitTest";

const { chainId } = parseArgs();

describe("Build ComputeQuery with DataQuery", () => {
  test("simple computeQuery with dataQuery", async () => {
    await runTestPass(chainId, "computeQuery/simple");
  }, 90000);

  test("simple computeQuery with dataQuery and address override", async () => {
    const { circuit, compiledCircuit, inputs } = await generateCircuit(chainId, "computeQuery/simple");
    
    const chainIdOverride = "84532";
    const addressOverride = "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";

    const axiom = new Axiom({
      circuit,
      compiledCircuit,
      chainId: chainIdOverride,
      provider: process.env[`PROVIDER_URI_${chainIdOverride}`] as string,
      privateKey: process.env[`PRIVATE_KEY_${chainIdOverride}`] as string,
      callback: {
        target: getTarget(chainId),
      },
      options: {
        overrides: {
          queryAddress: addressOverride,
        }
      }
    });
    await axiom.init();
    await axiom.prove(inputs);
    const args = axiom.getSendQueryArgs();
    if (!args) {
      throw new Error("Unable to get sendQuery args.");
    }
    expect(args.args[0]).toBe(chainIdOverride);
    expect(args.address).toBe(addressOverride);
  }, 90000);

  test("simple computeQuery with non-default capacity", async () => {
    await runTestPass(chainId, "computeQuery/simpleWithCapacity", {
      capacity: {
        maxOutputs: 256,
        maxSubqueries: 256,
      },
    });
  }, 90000);
});

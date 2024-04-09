import { Axiom } from "../../src";
import { generateCircuit, getTarget, parseArgs, runTestSendQuery } from "./circuitTest";

const CHAIN_ID = process.env.CHAIN_ID as string;

describe("Send Query using Axiom client", () => {
  test("Send a query", async () => {
    const receipt = await runTestSendQuery(CHAIN_ID, "sendQuery/average");
    expect(receipt.status).toBe('success');
  }, 90000);
});


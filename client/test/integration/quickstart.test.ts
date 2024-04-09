import { Axiom } from "../../src";
import { generateCircuit, getTarget, parseArgs, runTestSendQuery } from "./circuitTest";

const CHAIN_ID = process.env.CHAIN_ID as string;

describe("Quickstart", () => {
  test("Quickstart query", async () => {
    const receipt = await runTestSendQuery(CHAIN_ID, "quickstart/average");
    expect(receipt.status).toBe('success');
  }, 90000);
});

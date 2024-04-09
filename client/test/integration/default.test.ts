import { parseArgs, runTestSendQuery } from "./circuitTest";

const CHAIN_ID = process.env.CHAIN_ID as string;

describe("AxiomREPL old default circuit", () => {
  test("Default test circuit", async () => {
    const receipt = await runTestSendQuery(CHAIN_ID, "default/default");
    expect(receipt.status).toBe('success');
  }, 90000);
});

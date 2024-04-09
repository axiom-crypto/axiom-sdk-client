import { Axiom } from "../../src";
import { generateCircuit, getTarget, parseArgs, runTestSendQuery } from "./circuitTest";

const CHAIN_ID = process.env.CHAIN_ID as string;

describe("Build ComputeQuery Standalone", () => {
  test("simple computeQuery w/ no data subqueries", async () => {
    const receipt = await runTestSendQuery(CHAIN_ID, "computeQueryStandalone/computeQueryNoData");
    expect(receipt.status).toBe('success');
  }, 90000);

  test("larger computeQuery w/ no data subqueries", async () => {
    const receipt = await runTestSendQuery(CHAIN_ID, "computeQueryStandalone/computeQueryNoDataLarge");
    expect(receipt.status).toBe('success');
  }, 90000);
});

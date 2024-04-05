import { Axiom } from "../../src";
import { generateCircuit, getTarget, parseArgs, runTestPass } from "./circuitTest";

const CHAIN_ID = process.env.CHAIN_ID as string;

describe("Build ComputeQuery Standalone", () => {
  test("simple computeQuery w/ no data subqueries", async () => {
    await runTestPass(CHAIN_ID, "computeQueryStandalone/computeQueryNoData");
  }, 90000);

  test("larger computeQuery w/ no data subqueries", async () => {
    await runTestPass(CHAIN_ID, "computeQueryStandalone/computeQueryNoDataLarge");
  }, 90000);
});

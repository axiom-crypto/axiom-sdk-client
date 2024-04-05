import { Axiom } from "../../src";
import { generateCircuit, getTarget, parseArgs, runTestPass } from "./circuitTest";

const { chainId } = parseArgs();

describe("Build ComputeQuery Standalone", () => {
  test("simple computeQuery w/ no data subqueries", async () => {
    await runTestPass(chainId, "computeQueryStandalone/computeQueryNoData");
  }, 90000);

  test("larger computeQuery w/ no data subqueries", async () => {
    await runTestPass(chainId, "computeQueryStandalone/computeQueryNoDataLarge");
  }, 90000);
});

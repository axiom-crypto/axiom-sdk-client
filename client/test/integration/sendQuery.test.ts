import { Axiom } from "../../src";
import { generateCircuit, getTarget, parseArgs, runTestPass } from "./circuitTest";

const { chainId } = parseArgs();

describe("Send Query using Axiom client", () => {
  test("Send a query", async () => {
    await runTestPass(chainId, "sendQuery/average");
  }, 90000);
});
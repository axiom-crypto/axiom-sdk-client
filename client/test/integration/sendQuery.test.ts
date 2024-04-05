import { Axiom } from "../../src";
import { generateCircuit, getTarget, parseArgs, runTestPass } from "./circuitTest";

const CHAIN_ID = process.env.CHAIN_ID as string;

describe("Send Query using Axiom client", () => {
  test("Send a query", async () => {
    await runTestPass(CHAIN_ID, "sendQuery/average");
  }, 90000);
});


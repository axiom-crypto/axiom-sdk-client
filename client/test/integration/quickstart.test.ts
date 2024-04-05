import { Axiom } from "../../src";
import { generateCircuit, getTarget, parseArgs, runTestPass } from "./circuitTest";

const CHAIN_ID = process.env.CHAIN_ID as string;

describe("Quickstart", () => {
  test("Quickstart query", async () => {
    await runTestPass(CHAIN_ID, "quickstart/average");
  }, 90000);
});

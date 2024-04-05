import { Axiom } from "../../src";
import { generateCircuit, getTarget, parseArgs, runTestPass } from "./circuitTest";

const { chainId } = parseArgs();

describe("Quickstart", () => {
  test("Quickstart query", async () => {
    await runTestPass(chainId, "quickstart/average");
  }, 90000);
});

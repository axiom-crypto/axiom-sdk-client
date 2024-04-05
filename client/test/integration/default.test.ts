import { parseArgs, runTestPass } from "./circuitTest";

const CHAIN_ID = process.env.CHAIN_ID as string;

describe("AxiomREPL old default circuit", () => {
  test("Default test circuit", async () => {
    await runTestPass(CHAIN_ID, "default/default");
  }, 90000);
});

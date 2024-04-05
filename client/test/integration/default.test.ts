import { parseArgs, runTestPass } from "./circuitTest";

const { chainId } = parseArgs();

describe("AxiomREPL old default circuit", () => {
  test("Default test circuit", async () => {
    await runTestPass(chainId, "default/default");
  }, 90000);
});

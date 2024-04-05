import { parseArgs, runTestPass } from "./circuitTest";

const CHAIN_ID = process.env.CHAIN_ID as string;

describe("On-chain Data Query scenarios", () => {
  test("Send one of each DataQuery", async () => {
    await runTestPass(CHAIN_ID, "capacityDataQuery/oneOfEach");
  }, 90000);
  
  test("Send a size-128 header DataQuery", async () => {
    await runTestPass(CHAIN_ID, "capacityDataQuery/size128Header");
  }, 180000);
});

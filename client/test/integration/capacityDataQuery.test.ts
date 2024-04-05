import { parseArgs, runTestPass } from "./circuitTest";

const { chainId } = parseArgs();

describe("On-chain Data Query scenarios", () => {
  test("Send one of each DataQuery", async () => {
    await runTestPass(chainId, "capacityDataQuery/oneOfEach");
  }, 90000);
  
  test("Send a size-128 header DataQuery", async () => {
    await runTestPass(chainId, "capacityDataQuery/size128Header");
  }, 180000);
});

import { parseArgs, runTestSendQuery } from "./circuitTest";

const CHAIN_ID = process.env.CHAIN_ID as string;

describe("On-chain Data Query scenarios", () => {
  test("Send one of each DataQuery", async () => {
    const receipt = await runTestSendQuery(CHAIN_ID, "capacityDataQuery/oneOfEach");
    expect(receipt.status).toBe('success');
  }, 90000);
  
  test("Send a size-128 header DataQuery", async () => {
    const receipt = await runTestSendQuery(CHAIN_ID, "capacityDataQuery/size128Header");
    expect(receipt.status).toBe('success');
  }, 180000);
});

import { runTestSendQuery } from "./circuitTest";

const CHAIN_ID = process.env.CHAIN_ID as string;

describe("Harness Combo tests", () => {
  test("max30-1", async () => {
    const receipt = await runTestSendQuery(CHAIN_ID, "combo/max30-1");
    expect(receipt.status).toBe('success');
  }, 90000);

  test("max30-2", async () => {
    const receipt = await runTestSendQuery(CHAIN_ID, "combo/max30-2");
    expect(receipt.status).toBe('success');
  }, 90000);
  
  test("max128", async () => {
    const receipt = await runTestSendQuery(CHAIN_ID, "combo/max128");
    expect(receipt.status).toBe('success');
  }, 90000);

  test("receipt+tx", async () => {
    const receipt = await runTestSendQuery(CHAIN_ID, "combo/receipt+tx");
    expect(receipt.status).toBe('success');
  }, 90000);

  test("receipt+tx+mapping", async () => {
    const receipt = await runTestSendQuery(CHAIN_ID, "combo/receipt+tx+mapping");
    expect(receipt.status).toBe('success');
  }, 90000);

  test("receipt+tx+mapping+storage", async () => {
    const receipt = await runTestSendQuery(CHAIN_ID, "combo/receipt+tx+mapping+storage");
    expect(receipt.status).toBe('success');
  }, 90000);
});

import {
  getAxiomV2QueryAddress,
} from "../../../src/lib/address";

describe("Address library unit tests", () => {
  test("Basic addresses", () => {
    const mainnet = getAxiomV2QueryAddress("1");
    expect(mainnet).toEqual("0x83c8c0B395850bA55c830451Cfaca4F2A667a983");

    const sepolia = getAxiomV2QueryAddress("11155111");
    expect(sepolia).toEqual("0x83c8c0B395850bA55c830451Cfaca4F2A667a983");
  });
});
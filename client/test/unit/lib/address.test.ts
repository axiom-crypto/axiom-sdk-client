import {
  getAxiomV2BridgeAddress,
  getAxiomV2QueryAddress,
} from "../../../src/lib/address";

describe("Address library unit tests", () => {
  test("Basic addresses", () => {
    const mainnet = getAxiomV2QueryAddress("1");
    expect(mainnet).toEqual("0x83c8c0B395850bA55c830451Cfaca4F2A667a983");

    const mainnetMock = getAxiomV2QueryAddress("1", undefined, true);
    expect(mainnetMock).toEqual("");

    const sepolia = getAxiomV2QueryAddress("11155111");
    expect(sepolia).toEqual("0x83c8c0B395850bA55c830451Cfaca4F2A667a983");

    const sepoliaMock = getAxiomV2QueryAddress("11155111", undefined, true);
    expect(sepoliaMock).toEqual("0x83c8c0B395850bA55c830451Cfaca4F2A667a983");
  });

  test("Bridge addresses", () => {
    const mainnetOptimismBridge = getAxiomV2BridgeAddress("1", "10", 0);
    expect(mainnetOptimismBridge).toEqual("");
  });
});
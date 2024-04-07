import { ethers } from "ethers";
import { AxiomV2QueryBuilder, AxiomV2QueryBuilderConfig, HeaderField } from "../../../src";
import { ConstantsV2 } from "../../../src/queryBuilder/constants";

// Test coverage areas:
// - QueryBuilderV2 options

describe("QueryBuilderV2 Options", () => {
  const config: AxiomV2QueryBuilderConfig = {
    provider: process.env.PROVIDER_URI_MAINNET as string,
    caller: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    sourceChainId: 1,
    version: "v2",
  };
  const wallet = new ethers.Wallet(
    process.env.PRIVATE_KEY_ANVIL_DEFAULT as string,
    new ethers.JsonRpcProvider(process.env.PROVIDER_URI_MAINNET as string),
  );
  const blockNumber = 18300000;

  test("set maxFeePerGas", async () => {
    const axiom = new AxiomV2QueryBuilder(config);
    axiom.appendDataSubquery({
      blockNumber,
      fieldIdx: HeaderField.Timestamp,
    });
    axiom.setOptions({
      maxFeePerGas: "1000000000000",
    });
    const builtQuery = await axiom.build();
    expect(builtQuery.feeData.maxFeePerGas).toEqual("1000000000000");
    expect(builtQuery.feeData.callbackGasLimit).toEqual(ConstantsV2.DefaultCallbackGasLimit);
    expect(builtQuery.feeData.overrideAxiomQueryFee).toEqual("0");
    expect(builtQuery.refundee).toEqual((await wallet.getAddress()).toLowerCase());
  });

  test("set callbackGasLimit", async () => {
    const axiom = new AxiomV2QueryBuilder(config);
    axiom.appendDataSubquery({
      blockNumber,
      fieldIdx: HeaderField.Timestamp,
    });
    axiom.setOptions({
      callbackGasLimit: 10000,
    });
    const builtQuery = await axiom.build();
    expect(builtQuery.feeData.maxFeePerGas).toEqual(ConstantsV2.DefaultMaxFeePerGasWei);
    expect(builtQuery.feeData.callbackGasLimit).toEqual(10000);
    expect(builtQuery.feeData.overrideAxiomQueryFee).toEqual("0");
    expect(builtQuery.refundee).toEqual((await wallet.getAddress()).toLowerCase());
  });

  test("set refundee", async () => {
    const axiom = new AxiomV2QueryBuilder({...config, refundee: "0xe76a90E3069c9d86e666DcC687e76fcecf4429cF"});
    axiom.appendDataSubquery({
      blockNumber,
      fieldIdx: HeaderField.Timestamp,
    });
    const builtQuery = await axiom.build();
    expect(builtQuery.feeData.maxFeePerGas).toEqual(ConstantsV2.DefaultMaxFeePerGasWei);
    expect(builtQuery.feeData.callbackGasLimit).toEqual(ConstantsV2.DefaultCallbackGasLimit);
    expect(builtQuery.feeData.overrideAxiomQueryFee).toEqual("0");
    expect(builtQuery.refundee).toEqual("0xe76a90e3069c9d86e666dcc687e76fcecf4429cf");
  });
});

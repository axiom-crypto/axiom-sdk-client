import { getSlotForMapping, HeaderField, AccountField, TxField, getBlockNumberAndTxIdx, getFieldIdxTxCalldataIdx, getFieldIdxTxContractDataIdx, getEventSchema, getFieldIdxReceiptLogIdx } from "@axiom-crypto/tools";
import {
  QueryBuilderBase,
  QueryBuilderBaseConfig,
  Subquery,
} from "../../../src";
import { ethers } from "ethers";

describe("Query Validation Tests", () => {
  const WETH_ADDR = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const WSOL_ADDR = "0xd31a59c85ae9d8edefec411d448f90841571b89c";
  const WETH_WHALE = "0x2E15D7AA0650dE1009710FDd45C3468d75AE1392";
  const UNI_V3_FACTORY_ADDR = "0x1F98431c8aD98523631AE4a59f267346ea31F984";

  const provider = new ethers.JsonRpcProvider(process.env.PROVIDER_URI_MAINNET as string);
  const sepoliaProvider = new ethers.JsonRpcProvider(process.env.PROVIDER_URI_SEPOLIA as string);

  const config: QueryBuilderBaseConfig = {
    providerUri: process.env.PROVIDER_URI_MAINNET as string,
    version: "v2",
    sourceChainId: 1,
  };
  const sepoliaConfig = {
    providerUri: process.env.PROVIDER_URI_SEPOLIA as string,
    version: "v2",
    sourceChainId: "11155111",
  };

  test("Validate pass: Header subquery", async () => {
    const axiom = new QueryBuilderBase(config);
    axiom.appendDataSubquery({
      blockNumber: 17000000,
      fieldIdx: HeaderField.GasUsed,
    } as Subquery);
    const isValid = await axiom.validate();
    expect(isValid).toEqual(true);
  });

  test("Validate pass: Account subquery", async () => {
    const axiom = new QueryBuilderBase(config);
    const subquery = {
      blockNumber: 18000000,
      addr: WETH_WHALE,
      fieldIdx: AccountField.Balance
    };
    axiom.appendDataSubquery(subquery);
    const isValid = await axiom.validate();
    expect(isValid).toEqual(true);
  });

  test("Validate pass: Storage subquery", async () => {
    const axiom = new QueryBuilderBase(config);
    const slot = getSlotForMapping("3", "address", WETH_WHALE);
    const subquery = {
      blockNumber: 18000000,
      addr: WETH_ADDR,
      slot: slot
    };
    axiom.appendDataSubquery(subquery);
    const isValid = await axiom.validate();
    expect(isValid).toEqual(true);
  });

  test("Validate pass: Tx subquery", async () => {
    const axiom = new QueryBuilderBase(config);
    const txHash = "0x8d2e6cbd7cf1f88ee174600f31b79382e0028e239bb1af8301ba6fc782758bc6";
    const { blockNumber, txIdx } = await getBlockNumberAndTxIdx(provider, txHash);
    if (blockNumber === null || txIdx === null) {
      throw new Error("Failed to get block number and tx idx");
    }
    const subquery = {
      blockNumber,
      txIdx,
      fieldOrCalldataIdx: TxField.To
    };
    axiom.appendDataSubquery(subquery);
    const isValid = await axiom.validate();
    expect(isValid).toEqual(true);
  });

  test("Validate pass: Tx subquery calldata", async () => {
    const axiom = new QueryBuilderBase(config);
    const txHash = "0x192bc136b4637e0c31dc80b7c4e8cd63328c7c411ba8574af1841ed2c4a6dd80";
    const { blockNumber, txIdx } = await getBlockNumberAndTxIdx(provider, txHash);
    if (blockNumber === null || txIdx === null) {
      throw new Error("Failed to get block number and tx idx");
    }
    const subquery = {
      blockNumber,
      txIdx,
      fieldOrCalldataIdx: getFieldIdxTxCalldataIdx(0),
    };
    axiom.appendDataSubquery(subquery);
    const isValid = await axiom.validate();
    expect(isValid).toEqual(true);
  });

  test("Validate pass: Larger Tx subquery contractData", async () => {
    const axiom = new QueryBuilderBase(config);
    const txHash = "0xc9ef13429be1a3f44c75af95c4e2ac2083a3469e2751a42a04fcdace94ff98a5";
    const { blockNumber, txIdx } = await getBlockNumberAndTxIdx(provider, txHash);
    if (blockNumber === null || txIdx === null) {
      throw new Error("Failed to get block number and tx idx");
    }
    const subquery = {
      blockNumber,
      txIdx,
      fieldOrCalldataIdx: getFieldIdxTxContractDataIdx(0),
    };
    axiom.appendDataSubquery(subquery);
    const isValid = await axiom.validate();
    expect(isValid).toEqual(true);
  });

  test("Validate pass: Receipt subquery", async () => {
    const axiom = new QueryBuilderBase(config);
    const txHash = "0x8d2e6cbd7cf1f88ee174600f31b79382e0028e239bb1af8301ba6fc782758bc6";
    const { blockNumber, txIdx } = await getBlockNumberAndTxIdx(provider, txHash);
    if (blockNumber === null || txIdx === null) {
      throw new Error("Failed to get block number and tx idx");
    }
    const subquery = {
      blockNumber,
      txIdx,
      fieldOrLogIdx: getFieldIdxReceiptLogIdx(0),
      topicOrDataOrAddressIdx: 1,
      eventSchema: getEventSchema("Transfer(address,address,uint256)"),
    };
    axiom.appendDataSubquery(subquery);
    const isValid = await axiom.validate();
    expect(isValid).toEqual(true);
  });

  test("Validate pass: Solidity nested mapping subquery", async () => {
    const axiom = new QueryBuilderBase(config);
    const subquery = {
      blockNumber: 17000000,
      addr: UNI_V3_FACTORY_ADDR,
      mappingSlot: 5,
      mappingDepth: 3,
      keys: [WETH_ADDR, WSOL_ADDR, 10000]
    };
    axiom.appendDataSubquery(subquery);
    const isValid = await axiom.validate();
    expect(isValid).toEqual(true);
  });

  test("Validate fail: Header subquery", async () => {
    const axiom = new QueryBuilderBase(config);
    const testFn = async () => {
      const subquery = {
        blockNumber: 1234567,
        addr: "0x2E15D7AA0650dE1009710FDd45C3468d75AE1392",
        fieldIdx: HeaderField.Miner
      } as Subquery;
      axiom.appendDataSubquery(subquery);
      await axiom.validate();
    };
    await expect(testFn()).rejects.toThrow();
  });

  test("Validate fail: type 3 tx subquery", async () => {
    const axiom = new QueryBuilderBase(sepoliaConfig);
    const sepoliaTransactions = [
      // type 3
      "0x8fd091f4b5b1b17431110afa99fbd9cabdabecb92a1315afa458fc3dcb91efde",
      "0x95ea8f5b10f8ac9f48943ac32014705a10c76d54551391f1ed34c72c6c28fa83",
      "0x48c6fcfd6cbc753938d486cb33711b63d4330b48371a7919648c9e1506d6b6e9",
      "0xbdb6eb8982db0695f6685840d01667d9c7beb5140b96e6af38c346c6a0de2edf",
      "0xaeac36b485d4c6672f6d7337ab8015b0d4483724151dfda88214c0e4fd675542",
    ];

    for (const txHash of sepoliaTransactions) {
      const { blockNumber, txIdx } = await getBlockNumberAndTxIdx(sepoliaProvider, txHash);
      if (blockNumber === null || txIdx === null) {
        throw new Error("Failed to get block number and tx idx");
      }
      axiom.appendDataSubquery({
        blockNumber,
        txIdx,
        fieldOrCalldataIdx: TxField.To
      } as Subquery);
      const isValid = await axiom.validate();
      expect(isValid).toEqual(false);
    }
  });
});

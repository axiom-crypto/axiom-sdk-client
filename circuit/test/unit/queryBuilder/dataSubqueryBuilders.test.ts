import {
  AccountField,
  HeaderField,
  TxField,
  getBlockNumberAndTxIdx,
  bytes32,
  AxiomV2FieldConstant,
  TxSubquery,
  ReceiptSubquery,
  getFieldIdxHeaderLogsBloomIdx,
  getEventSchema,
  getFieldIdxReceiptLogIdx,
  getFieldIdxReceiptLogAddress,
  getFieldIdxReceiptLogsBloomIdx,
} from "@axiom-crypto/tools";
import {
  AxiomV2QueryBuilderBase,
  AxiomV2QueryBuilderBaseConfig,
  HeaderSubquery,
  AccountSubquery,
  SolidityNestedMappingSubquery,
  StorageSubquery,
} from "../../../src";
import { ethers } from "ethers";

// Test coverage areas:
// - DataQuery subquery builders
// - DataQuery subquery types

describe("Data Subquery Builders", () => {
  const WETH_ADDR = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2".toLowerCase();
  const WETH_WHALE = "0x2E15D7AA0650dE1009710FDd45C3468d75AE1392".toLowerCase();

  const provider = new ethers.JsonRpcProvider(process.env.PROVIDER_URI_MAINNET as string);
  const blockNumber = 18000000;

  const config: AxiomV2QueryBuilderBaseConfig = {
    providerUri: process.env.PROVIDER_URI_MAINNET as string,
    caller: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    sourceChainId: 1,
    version: "v2",
  };

  test("Build and append a header subquery", () => {
    const axiom = new AxiomV2QueryBuilderBase(config);
    axiom.appendDataSubquery({
      blockNumber: blockNumber,
      fieldIdx: HeaderField.GasUsed,
    });
    const dataQuery = axiom.getDataQuery();

    const subquery = dataQuery?.[0] as HeaderSubquery;
    expect(subquery?.blockNumber).toEqual(blockNumber);
    expect(subquery?.fieldIdx).toEqual(HeaderField.GasUsed);
  });

  test("Build and append a header logsBloom subquery", () => {
    const axiom = new AxiomV2QueryBuilderBase(config);
    axiom.appendDataSubquery({
      blockNumber: blockNumber,
      fieldIdx: getFieldIdxHeaderLogsBloomIdx(2),
    });
    const dataQuery = axiom.getDataQuery();

    const subquery = dataQuery?.[0] as HeaderSubquery;
    expect(subquery?.blockNumber).toEqual(blockNumber);
    expect(subquery?.fieldIdx).toEqual(AxiomV2FieldConstant.Header.LogsBloomFieldIdxOffset + 2);
  });

  test("Build and append an account subquery", () => {
    const axiom = new AxiomV2QueryBuilderBase(config);
    axiom.appendDataSubquery({
      blockNumber: blockNumber,
      addr: WETH_WHALE,
      fieldIdx: AccountField.Balance,
    });
    const dataQuery = axiom.getDataQuery();

    const subquery = dataQuery?.[0] as AccountSubquery;
    expect(subquery?.blockNumber).toEqual(blockNumber);
    expect(subquery?.addr).toEqual(WETH_WHALE);
    expect(subquery?.fieldIdx).toEqual(AccountField.Balance);
  });

  test("Build and append a storage subquery", () => {
    const axiom = new AxiomV2QueryBuilderBase(config);
    axiom.appendDataSubquery({
      blockNumber: blockNumber,
      addr: WETH_ADDR,
      slot: 1,
    });
    const dataQuery = axiom.getDataQuery();

    const subquery = dataQuery?.[0] as StorageSubquery;
    expect(subquery?.blockNumber).toEqual(blockNumber);
    expect(subquery?.addr).toEqual(WETH_ADDR);
    expect(subquery?.slot).toEqual(1);
  });

  test("Build and append a tx subquery", async () => {
    const axiom = new AxiomV2QueryBuilderBase(config);
    const txHash = "0x8d2e6cbd7cf1f88ee174600f31b79382e0028e239bb1af8301ba6fc782758bc6";
    const { blockNumber, txIdx } = await getBlockNumberAndTxIdx(provider, txHash);
    if (blockNumber === null || txIdx === null) {
      throw new Error("Failed to get block number and tx idx");
    }
    axiom.appendDataSubquery({
      blockNumber: blockNumber,
      txIdx: txIdx,
      fieldOrCalldataIdx: TxField.MaxPriorityFeePerGas,
    });
    const dataQuery = axiom.getDataQuery();

    // Check the unbuilt subquery
    const subquery = dataQuery?.[0] as TxSubquery;
    expect(subquery?.blockNumber).toEqual(blockNumber);
    expect(subquery?.txIdx).toEqual(txIdx);
    expect(subquery?.fieldOrCalldataIdx).toEqual(2);

    // Build the Query and validate the built subquery
    const built = await axiom.buildBase();
    const builtSubquery = built.dataQueryStruct.subqueries?.[0].subqueryData as TxSubquery;
    expect(builtSubquery?.blockNumber).toEqual(blockNumber);
    expect(builtSubquery?.txIdx).toEqual(txIdx);
    expect(builtSubquery?.fieldOrCalldataIdx).toEqual(2);
  });

  test("Build and append a receipt subquery", async () => {
    const axiom = new AxiomV2QueryBuilderBase(config);
    const txHash = "0x8d2e6cbd7cf1f88ee174600f31b79382e0028e239bb1af8301ba6fc782758bc6";
    const { blockNumber, txIdx } = await getBlockNumberAndTxIdx(provider, txHash);
    if (blockNumber === null || txIdx === null) {
      throw new Error("Failed to get block number and tx idx");
    }
    axiom.appendDataSubquery({
      blockNumber: blockNumber,
      txIdx: txIdx,
      fieldOrLogIdx: getFieldIdxReceiptLogIdx(0),
      topicOrDataOrAddressIdx: 1,
      eventSchema: getEventSchema("Transfer (address from, address to, uint256 value)"),
    });
    const dataQuery = axiom.getDataQuery();

    // Check the unbuilt subquery
    const subquery = dataQuery?.[0] as ReceiptSubquery;
    expect(subquery?.blockNumber).toEqual(blockNumber);
    expect(subquery?.txIdx).toEqual(txIdx);
    expect(subquery?.fieldOrLogIdx).toEqual(100);
    expect(subquery?.topicOrDataOrAddressIdx).toEqual(1);
    expect(subquery?.eventSchema).toEqual("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef");

    // Build the Query and validate the built subquery
    const built = await axiom.buildBase();
    const builtSubquery = built.dataQueryStruct.subqueries?.[0].subqueryData as ReceiptSubquery;
    expect(builtSubquery?.blockNumber).toEqual(blockNumber);
    expect(builtSubquery?.txIdx).toEqual(txIdx);
    expect(builtSubquery?.fieldOrLogIdx).toEqual(100);
    expect(builtSubquery?.topicOrDataOrAddressIdx).toEqual(1);
    expect(builtSubquery?.eventSchema).toEqual("0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef");
  });

  test("Build and append a receipt log address subquery", async () => {
    const axiom = new AxiomV2QueryBuilderBase(config);
    const txHash = "0x8d2e6cbd7cf1f88ee174600f31b79382e0028e239bb1af8301ba6fc782758bc6";
    const { blockNumber, txIdx } = await getBlockNumberAndTxIdx(provider, txHash);
    if (blockNumber === null || txIdx === null) {
      throw new Error("Failed to get block number and tx idx");
    }
    axiom.appendDataSubquery({
      blockNumber: blockNumber,
      txIdx: txIdx,
      fieldOrLogIdx: getFieldIdxReceiptLogIdx(0),
      topicOrDataOrAddressIdx: getFieldIdxReceiptLogAddress(),
      eventSchema: bytes32(0),
    });
    const dataQuery = axiom.getDataQuery();

    // Check the unbuilt subquery
    const subquery = dataQuery?.[0] as ReceiptSubquery;
    expect(subquery?.blockNumber).toEqual(blockNumber);
    expect(subquery?.txIdx).toEqual(txIdx);
    expect(subquery?.fieldOrLogIdx).toEqual(100);
    expect(subquery?.topicOrDataOrAddressIdx).toEqual(50);
    expect(subquery?.eventSchema).toEqual(bytes32(0));

    // Build the Query and validate the built subquery
    const built = await axiom.buildBase();
    const builtSubquery = built.dataQueryStruct.subqueries?.[0].subqueryData as ReceiptSubquery;
    expect(builtSubquery?.blockNumber).toEqual(blockNumber);
    expect(builtSubquery?.txIdx).toEqual(txIdx);
    expect(builtSubquery?.fieldOrLogIdx).toEqual(100);
    expect(builtSubquery?.topicOrDataOrAddressIdx).toEqual(50);
    expect(builtSubquery?.eventSchema).toEqual(bytes32(0));
  });

  test("Build and append a receipt logsBloom subquery", async () => {
    const axiom = new AxiomV2QueryBuilderBase(config);

    const txHash = "0x8d2e6cbd7cf1f88ee174600f31b79382e0028e239bb1af8301ba6fc782758bc6";
    const { blockNumber, txIdx } = await getBlockNumberAndTxIdx(provider, txHash);
    axiom.appendDataSubquery({
      blockNumber: blockNumber,
      txIdx: txIdx,
      fieldOrLogIdx: getFieldIdxReceiptLogsBloomIdx(2),
      topicOrDataOrAddressIdx: 0,
      eventSchema: bytes32(0),
    });
    const dataQuery = axiom.getDataQuery();

    // Check the unbuilt subquery
    const subquery = dataQuery?.[0] as ReceiptSubquery;
    expect(subquery?.blockNumber).toEqual(blockNumber);
    expect(subquery?.txIdx).toEqual(txIdx);
    expect(subquery?.fieldOrLogIdx).toEqual(AxiomV2FieldConstant.Receipt.LogsBloomIdxOffset + 2);

    // Build the Query and validate the built subquery
    const built = await axiom.buildBase();
    const builtSubquery = built.dataQueryStruct.subqueries?.[0].subqueryData as ReceiptSubquery;
    expect(builtSubquery?.blockNumber).toEqual(blockNumber);
    expect(builtSubquery?.txIdx).toEqual(txIdx);
    expect(builtSubquery?.fieldOrLogIdx).toEqual(AxiomV2FieldConstant.Receipt.LogsBloomIdxOffset + 2);
    expect(builtSubquery?.topicOrDataOrAddressIdx).toEqual(0);
    expect(builtSubquery?.eventSchema).toEqual(bytes32(0));
  });

  test("Build and append a nested mapping subquery", async () => {
    const axiom = new AxiomV2QueryBuilderBase(config);
    axiom.appendDataSubquery({
      blockNumber: blockNumber,
      addr: WETH_ADDR,
      mappingSlot: 0,
      mappingDepth: 3,
      keys: [WETH_ADDR, WETH_WHALE, 100000],
    });
    const dataQuery = axiom.getDataQuery();

    const subquery = dataQuery?.[0] as SolidityNestedMappingSubquery;
    expect(subquery?.blockNumber).toEqual(blockNumber);
    expect(subquery?.addr).toEqual(WETH_ADDR);
    expect(subquery?.mappingSlot).toEqual(0);
    expect(subquery?.mappingDepth).toEqual(3);
    expect(subquery?.keys).toEqual([WETH_ADDR, WETH_WHALE, 100000]);

    // Build the Query and validate the built subquery
    const built = await axiom.buildBase();
    const builtSubquery = built.dataQueryStruct.subqueries?.[0].subqueryData as SolidityNestedMappingSubquery;
    expect(builtSubquery?.blockNumber).toEqual(blockNumber);
    expect(builtSubquery?.addr).toEqual(WETH_ADDR);
    expect(builtSubquery?.mappingSlot).toEqual(0);
    expect(builtSubquery?.mappingDepth).toEqual(3);
    expect(builtSubquery?.keys).toEqual([bytes32(WETH_ADDR), bytes32(WETH_WHALE), bytes32(100000)]);
  });
});

import { bytes32, getBlockNumberAndTxIdx } from "@axiom-crypto/tools";
import {
  AccountField,
  QueryBuilderBase,
  QueryBuilderBaseConfig,
  HeaderField,
  ReceiptField,
  TxField,
  Subquery,
} from "../../../src";
import { ConstantsV2 } from "../../../src/queryBuilderBase/constants";
import { JsonRpcProvider } from "ethers";

// Test coverage areas:
// - DataQuery capacity
// - Appending subqueries

describe("DataQuery Capacity (SDK-enforced)", () => {
  const WETH_ADDR = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const WETH_WHALE = "0x2E15D7AA0650dE1009710FDd45C3468d75AE1392";
  const WSOL_ADDR = "0xd31a59c85ae9d8edefec411d448f90841571b89c";
  const UNI_V3_FACTORY_ADDR = "0x1F98431c8aD98523631AE4a59f267346ea31F984";

  const config: QueryBuilderBaseConfig = {
    rpcUrl: process.env.PROVIDER_URI_MAINNET as string,
    version: "v2",
  }

  // mainnet block 18500000 txIdx [0,33)
  const validMainnetTxHashes = [
    "0x122f25a52c76682fb0e6b904b3b666e6a9bf5008af0d4c3b474d4e3010c4d5f9",
    "0xb0c21cf68a743788c10d759845db5b922c8ac3971b0583d169174f6e2da086f5",
    "0xb3fb7ac99ecd6a981a08d94665d08b8303e6b907c33c6562b8226f2ee64e15c5",
    "0x35a39c1d1c8ac6f6e8c175de0cdfcb1e9ed7ee4303f2e562f86d2290d93215ba",
    "0x1fafb1edf72f30a5db7835421d0869d155d9a4cf53d077ca18b7ec572febdcf8",
    "0x080281b5ccd4c6d3210ab08806bdf27cad889e61ed526a6e0636cdc00aa74705",
    "0x17c26492b5211cb4fa038f2960319e8bd6e90f9c1e9731534e841d09c4e5c2df",
    "0xef9ac5c744f9e1d6c07d02c11c8a2ae5acccf4bb1fc05608d6b025bca2f6b1f5",
    "0xd89a3851ceb10019d1613a623e68c187292c05a12d70d8c28c312b2153999c8e",
    "0x7e8b9c439e8dca9e660ffa071ccf24dd6a12e20e8d7ad31d50bb059b031c0975",
    "0xdd5b8c85fd74861566d38da30a58deef0dcb6a0c7e7b4eeff28102dd227786ff",
    "0xd5f40ce15676c81c160f3da5dd09398957a2c6918e32f377c767cdab1bb5bf93",
    "0xba4345f28b7c714a478b989a2474cee11a6062d6b9f838cc27bec77c46767bcd",
    "0xc94a955a2f8c48dc4f14f4183aff4b23aede06ff7fcd7888b18cb407a707fa74",
    "0xb9a9682b520feeaf099b6643dfae9b6432263da5e7469a01276aa39064509031",
    "0x741fb87be70e45db2d82d7f5cdbb2e7ef39fb19b5ef4ab544c09b9c83a67c7b7",
    "0x1f34e4e287336fa22b3bb950c7933aac122a5add167468a9681265faa963ff40",
    "0x2e8e7d7e17a076b0b69dbc188049d02ee983cc066356274cc8f424fa0edc26fd",
    "0x87f77e87290836e5174bf340c3a44d78cd033845d32617cdd55bf12136b17233",
    "0x5e6e43d3310878616d60b7760f9bd39f0aedcb2c65134738fb5354b9eb35be95",
    "0x7355606b0ca4f85467d5c56ea1ae3fcfa2d4f9238cf20bee7a71ada6a889dcd8",
    "0x4506010aa2ce63e97a141bacb9e10147b3eeeae53e98a5ef0475c3320c0ad466",
    "0x4cbae4bac1cf87cf8f32ada1727950be149ef294a2166310d3f67e574c03c300",
    "0xb1724fd30f5d5a77b2199fceac48ce60df66f074d59dcccdb12bcef56b9e4e3e",
    "0xc02472f7ef14a9c960defe6ecac170bcb98c24829cc75027c63d7659e9262464",
    "0xec2e654d06498ed0f47d68762e862059e3f8971c92b189aee92538db604e4605",
    "0x4f46e2c0d19ce1bb1e0cb50bf0e884b13b50f13bdbd92eddcd1676af599545f6",
    "0x73a028b6c5a1babdb4081df839b9a7a3bf7c0ada4df14060c670ab25eef89851",
    "0x6c9bd68a38d01dc374fc57053b0b9c1737f2611f00254446d5ca3db9dac740b5",
    "0x161944cb3d51e7d531ff0f45bcba612dd04a0973cd38e219fc85bbc061e0ab4f",
    "0x16b844a564c78386f62ad934474243a9ec97c171cb3bd3080757f677fadea788",
    "0xd85e411ae03daa7cf11352795b05a2b1c6bba1cb4144284f510ea379481994a1",
    // "0x079fe983f70c4c176e2b15d0fa4392c5a30fc535055d10fca31003cb48037ba0", // 33
  ];

  const provider = new JsonRpcProvider(process.env.PROVIDER_URI_MAINNET as string);

  test(`Append ${ConstantsV2.UserMaxTotalSubqueries} Header subqueries`, () => {
    const axiom = new QueryBuilderBase(config);
    const blockNumber = 18000000;
    for (let i = 0; i < ConstantsV2.UserMaxTotalSubqueries; i++) {
      axiom.appendDataSubquery({
        blockNumber: blockNumber + i,
        fieldIdx: HeaderField.Nonce,
      } as Subquery);
    }
  });

  test(`Append ${ConstantsV2.UserMaxTotalSubqueries + 1} Header subqueries fail`, () => {
    const axiom = new QueryBuilderBase(config);
    const testFn = () => {
      const blockNumber = 18000000;
      for (let i = 0; i < ConstantsV2.UserMaxTotalSubqueries + 1; i++) {
        axiom.appendDataSubquery({
          blockNumber: blockNumber + i,
          fieldIdx: HeaderField.Nonce,
        } as Subquery);
      }
    };
    expect(testFn).toThrow();
  });

  test(`Append ${ConstantsV2.UserMaxTotalSubqueries} Account subqueries`, () => {
    const axiom = new QueryBuilderBase(config);
    const blockNumber = 18000000;
    for (let i = 0; i < ConstantsV2.UserMaxTotalSubqueries; i++) {
      axiom.appendDataSubquery({
        blockNumber: blockNumber + i,
        addr: WETH_WHALE,
        fieldIdx: AccountField.Balance,
      } as Subquery);
    }
  });

  test(`Append ${ConstantsV2.UserMaxTotalSubqueries + 1} Account subqueries fail`, () => {
    const axiom = new QueryBuilderBase(config);
    const testFn = () => {
      const blockNumber = 18000000;
      for (let i = 0; i < ConstantsV2.UserMaxTotalSubqueries + 1; i++) {
        axiom.appendDataSubquery({
          blockNumber: blockNumber + i,
          addr: WETH_WHALE,
          fieldIdx: AccountField.Balance,
        } as Subquery);
      }
    };
    expect(testFn).toThrow();
  });

  test(`Append ${ConstantsV2.UserMaxTotalSubqueries} Storage subqueries`, () => {
    const axiom = new QueryBuilderBase(config);
    const blockNumber = 18000000;
    for (let i = 0; i < ConstantsV2.UserMaxTotalSubqueries; i++) {
      axiom.appendDataSubquery({
        blockNumber: blockNumber + i,
        addr: WETH_ADDR,
        slot: 0,
      } as Subquery);
    }
  });

  test(`Append ${ConstantsV2.UserMaxTotalSubqueries + 1} Storage subqueries fail`, () => {
    const axiom = new QueryBuilderBase(config);
    const testFn = () => {
      const blockNumber = 18000000;
      for (let i = 0; i < ConstantsV2.UserMaxTotalSubqueries + 1; i++) {
        axiom.appendDataSubquery({
          blockNumber: blockNumber + i,
          addr: WETH_ADDR,
          slot: 0,
        } as Subquery);
      }
    };
    expect(testFn).toThrow();
  });

  test(`Append ${ConstantsV2.UserMaxTotalSubqueries} Solidity Nested Mapping subqueries`, () => {
    const axiom = new QueryBuilderBase(config);
    const blockNumber = 18000000;
    for (let i = 0; i < ConstantsV2.UserMaxTotalSubqueries; i++) {
      axiom.appendDataSubquery({
        blockNumber: blockNumber + i,
        addr: UNI_V3_FACTORY_ADDR,
        mappingSlot: 5,
        mappingDepth: 3,
        keys: [WETH_ADDR, WSOL_ADDR, 10000],
      } as Subquery);
    }
  });

  test(`Append ${ConstantsV2.UserMaxTotalSubqueries + 1} Solidity Nested Mapping subqueries fail`, () => {
    const axiom = new QueryBuilderBase(config);
    const testFn = () => {
      const blockNumber = 18000000;
      for (let i = 0; i < ConstantsV2.UserMaxTotalSubqueries + 1; i++) {
        axiom.appendDataSubquery({
          blockNumber: blockNumber + i,
          addr: UNI_V3_FACTORY_ADDR,
          mappingSlot: 5,
          mappingDepth: 3,
          keys: [WETH_ADDR, WSOL_ADDR, 10000],
        } as Subquery);
      }
    };
    expect(testFn).toThrow();
  });

  test(`Append 43 Account + 43 Storage + 42 Nested Mapping subqueries`, () => {
    const axiom = new QueryBuilderBase(config);
    const blockNumber = 18000000;
    for (let i = 0; i < 43; i++) {
      axiom.appendDataSubquery({
        blockNumber: blockNumber + i,
        addr: WETH_WHALE,
        fieldIdx: AccountField.Balance,
      } as Subquery);
      axiom.appendDataSubquery({
        blockNumber: blockNumber + i,
        addr: WETH_ADDR,
        slot: 0,
      } as Subquery);
      if (i === 42) {
        continue;
      }
      axiom.appendDataSubquery({
        blockNumber: blockNumber + i,
        addr: UNI_V3_FACTORY_ADDR,
        mappingSlot: 5,
        mappingDepth: 3,
        keys: [WETH_ADDR, WSOL_ADDR, 10000],
      } as Subquery);
    }
  });

  test(`Append 43 Account + 43 Storage + 43 Nested Mapping subqueries fail`, () => {
    const axiom = new QueryBuilderBase(config);
    const testFn = () => {
      const blockNumber = 18000000;
      for (let i = 0; i < 43; i++) {
        axiom.appendDataSubquery({
          blockNumber: blockNumber + i,
          addr: WETH_WHALE,
          field: AccountField.Balance,
        } as Subquery);
        axiom.appendDataSubquery({
          blockNumber: blockNumber + i,
          addr: WETH_ADDR,
          slot: 0,
        } as Subquery);
        axiom.appendDataSubquery({
          blockNumber: blockNumber + i,
          addr: UNI_V3_FACTORY_ADDR,
          mappingSlot: 5,
          keys: [WETH_ADDR, WSOL_ADDR, 10000],
        } as Subquery);
      }
    };
    expect(testFn).toThrow();
  });

  test(`Append ${ConstantsV2.UserMaxTotalSubqueries} Tx subqueries`, async () => {
    const axiom = new QueryBuilderBase(config);
    for (let i = 0; i < validMainnetTxHashes.length; i++) {
      const { blockNumber, txIdx } = await getBlockNumberAndTxIdx(provider, validMainnetTxHashes[i]);
      if (blockNumber === null || txIdx === null) {
        throw new Error("blockNumber or txIdx is null");
      }
      axiom.appendDataSubquery({
        blockNumber,
        txIdx,
        fieldOrCalldataIdx: TxField.To,
      } as Subquery);
      axiom.appendDataSubquery({
        blockNumber,
        txIdx,
        fieldOrCalldataIdx: TxField.ChainId,
      } as Subquery);
      axiom.appendDataSubquery({
        blockNumber,
        txIdx,
        fieldOrCalldataIdx: TxField.GasPrice,
      } as Subquery);
      axiom.appendDataSubquery({
        blockNumber,
        txIdx,
        fieldOrCalldataIdx: TxField.Nonce,
      } as Subquery);
    }
  }, 60000);

  test(`Append ${ConstantsV2.UserMaxTotalSubqueries + 1} Tx subqueries fail`, async () => {
    const axiom = new QueryBuilderBase(config);
    for (let i = 0; i < validMainnetTxHashes.length; i++) {
      const { blockNumber, txIdx } = await getBlockNumberAndTxIdx(provider, validMainnetTxHashes[i]);
      if (blockNumber === null || txIdx === null) {
        throw new Error("blockNumber or txIdx is null");
      }
      axiom.appendDataSubquery({
        blockNumber,
        txIdx,
        fieldOrCalldataIdx: TxField.To,
      } as Subquery);
      axiom.appendDataSubquery({
        blockNumber,
        txIdx,
        fieldOrCalldataIdx: TxField.ChainId,
      } as Subquery);
      axiom.appendDataSubquery({
        blockNumber,
        txIdx,
        fieldOrCalldataIdx: TxField.GasPrice,
      } as Subquery);
      axiom.appendDataSubquery({
        blockNumber,
        txIdx,
        fieldOrCalldataIdx: TxField.Nonce,
      } as Subquery);
    }
    const oneMore = async () => {
      const { blockNumber, txIdx } = await getBlockNumberAndTxIdx(provider, validMainnetTxHashes[0]);
      if (blockNumber === null || txIdx === null) {
        throw new Error("blockNumber or txIdx is null");
      }
      axiom.appendDataSubquery({
        blockNumber,
        txIdx,
        fieldOrCalldataIdx: TxField.To,
      } as Subquery);
    };
    await expect(oneMore()).rejects.toThrow();
  }, 60000);

  test(`Append ${ConstantsV2.UserMaxTotalSubqueries} Receipt subqueries`, async () => {
    const axiom = new QueryBuilderBase(config);
    for (let i = 0; i < validMainnetTxHashes.length; i++) {
      const { blockNumber, txIdx } = await getBlockNumberAndTxIdx(provider, validMainnetTxHashes[i]);
      if (blockNumber === null || txIdx === null) {
        throw new Error("blockNumber or txIdx is null");
      }
      axiom.appendDataSubquery({
        blockNumber,
        txIdx,
        fieldOrLogIdx: ReceiptField.Status,
        topicOrDataOrAddressIdx: 0,
        eventSchema: bytes32(0),
      } as Subquery);
      axiom.appendDataSubquery({
        blockNumber,
        txIdx,
        fieldOrLogIdx: ReceiptField.LogsBloom,
        topicOrDataOrAddressIdx: 0,
        eventSchema: bytes32(0),
      } as Subquery);
      axiom.appendDataSubquery({
        blockNumber,
        txIdx,
        fieldOrLogIdx: ReceiptField.Logs,
        topicOrDataOrAddressIdx: 0,
        eventSchema: bytes32(0),
      } as Subquery);
      axiom.appendDataSubquery({
        blockNumber,
        txIdx,
        fieldOrLogIdx: ReceiptField.CumulativeGas,
        topicOrDataOrAddressIdx: 0,
        eventSchema: bytes32(0),
      } as Subquery);
    }
  }, 60000);

  test(`Append ${ConstantsV2.UserMaxTotalSubqueries + 1} Receipt subqueries fail`, async () => {
    const axiom = new QueryBuilderBase(config);
    const testFn = async () => {
      const txHashes = validMainnetTxHashes.slice(0, ConstantsV2.UserMaxTotalSubqueries + 1);
      for (let i = 0; i < ConstantsV2.UserMaxTotalSubqueries + 1; i++) {
        const { blockNumber, txIdx } = await getBlockNumberAndTxIdx(provider, txHashes[i]);
        if (blockNumber === null || txIdx === null) {
          throw new Error("blockNumber or txIdx is null");
        }
        axiom.appendDataSubquery({
          blockNumber,
          txIdx,
          fieldOrLogIdx: ReceiptField.Status,
          topicOrDataOrAddressIdx: 0,
          eventSchema: bytes32(0),
        } as Subquery);
      }
    };
    await expect(testFn()).rejects.toThrow();
  }, 60000);

  test(`Append ${ConstantsV2.UserMaxTotalSubqueries} subqueries`, async () => {
    const axiom = new QueryBuilderBase(config);

    for (let i = 0; i < ConstantsV2.UserMaxTotalSubqueries / 4; i++) {
      const { blockNumber, txIdx } = await getBlockNumberAndTxIdx(provider, validMainnetTxHashes[i]);
      if (blockNumber === null || txIdx === null) {
        throw new Error("blockNumber or txIdx is null");
      }
      axiom.appendDataSubquery({
        blockNumber: blockNumber + i,
        fieldIdx: HeaderField.Nonce,
      } as Subquery);
      axiom.appendDataSubquery({
        blockNumber: blockNumber + i,
        addr: WETH_WHALE,
        fieldIdx: AccountField.Balance,
      } as Subquery);
      axiom.appendDataSubquery({
        blockNumber,
        txIdx,
        fieldOrCalldataIdx: TxField.To,
      } as Subquery);
      axiom.appendDataSubquery({
        blockNumber,
        txIdx,
        fieldOrLogIdx: ReceiptField.Status,
        topicOrDataOrAddressIdx: 0,
        eventSchema: bytes32(0),
      } as Subquery);
    }
  }, 60000);
});

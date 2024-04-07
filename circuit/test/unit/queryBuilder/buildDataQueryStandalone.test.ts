import { ethers } from "ethers";
import {
  AccountField,
  AxiomV2QueryBuilder,
  AxiomV2QueryBuilderConfig,
  AxiomV2Callback,
  AxiomV2ComputeQuery,
  HeaderField,
  ReceiptField,
  TxField,
} from "../../../src";
import { bytes32 } from "@axiom-crypto/tools";

// Test coverage areas:
// - DataQuery
// - Callback

describe("Build DataQuery Standalone", () => {
  const WETH_ADDR = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const WETH_WHALE = "0x2E15D7AA0650dE1009710FDd45C3468d75AE1392";
  const WSOL_ADDR = "0xd31a59c85ae9d8edefec411d448f90841571b89c";
  const UNI_V3_FACTORY_ADDR = "0x1F98431c8aD98523631AE4a59f267346ea31F984";

  const config: AxiomV2QueryBuilderConfig = {
    provider: process.env.PROVIDER_URI_SEPOLIA as string,
    caller: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    sourceChainId: "1",
    version: "v2",
  };
  const axiom = new AxiomV2QueryBuilder(config);

  const callback: AxiomV2Callback = {
    target: "0x41a7a901ef58d383801272d2408276d96973550d",
    extraData: bytes32("0xbbd0d3671093a36d6e3b608a7e3b1fdc96da1116"),
  };

  test("simple dataQuery", async () => {
    const blockNumber = 18200000;
    const dataQueryReq = [
      {
        blockNumber: blockNumber,
        fieldIdx: HeaderField.GasUsed,
      },
      {
        blockNumber: blockNumber + 100,
        fieldIdx: HeaderField.GasUsed,
      },
    ];
    axiom.append(dataQueryReq);
    axiom.setCallback(callback);

    const builtQuery = await axiom.build();
    if (builtQuery === undefined) {
      throw new Error("builtQuery is undefined");
    }

    expect(builtQuery.queryHash).toEqual("0xda1933a884934070a870d18243ec2f1a7efa869966c4cf52d03b179c998a4825");
    expect(builtQuery.dataQueryHash).toEqual("0xfaaac492509be62a2026a769d31140ee49e4b662e56c95251b8ca6ccace0e91b");
    expect(builtQuery.dataQuery).toEqual("0x0000000000000001000200010115b5c00000000a00010115b6240000000a");
    expect(builtQuery.computeQuery.k).toEqual(0);
    expect(builtQuery.computeQuery.vkey.length).toEqual(0);
    expect(builtQuery.computeQuery.vkey).toEqual([]);
    expect(builtQuery.computeQuery.computeProof).toEqual("0x00");
  });

  test("simple dataQuery with all types", async () => {
    const blockNumber = 17000000;
    const txHash = "0xc94a955a2f8c48dc4f14f4183aff4b23aede06ff7fcd7888b18cb407a707fa74";

    const dataQueryReq = [
      {
        blockNumber: blockNumber,
        fieldIdx: HeaderField.GasLimit,
      },
      {
        blockNumber: blockNumber + 1,
        addr: WETH_WHALE,
        fieldIdx: 1,
      },
      {
        blockNumber: blockNumber,
        addr: WETH_ADDR,
        slot: 0,
      },
      {
        blockNumber: 17975259,
        txIdx: 34,
        // txHash: "0x47082a4eaba054312c652a21c6d75a44095b8be43c60bdaeffad03d38a8b1602",
        fieldOrLogIdx: ReceiptField.CumulativeGas,
        topicOrDataOrAddressIdx: 10,
        eventSchema: ethers.ZeroHash,
      },
    ];
    axiom.append(dataQueryReq);
    axiom.setCallback(callback);

    const builtQuery = await axiom.build();
    if (builtQuery === undefined) {
      throw new Error("builtQuery is undefined");
    }
  });
});

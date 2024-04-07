import { bytes32 } from "@axiom-crypto/tools";
import { 
  AxiomV2QueryBuilder,
  AxiomV2QueryBuilderConfig,
  AxiomV2Callback,
  HeaderField,
} from "../../../src";

// Test coverage areas:
// - Crosschain

describe("Crosschain", () => {
  const callback: AxiomV2Callback = {
    target: "0x41a7a901ef58d383801272d2408276d96973550d",
    extraData: bytes32("0xbbd0d3671093a36d6e3b608a7e3b1fdc96da1116"),
  };

  test("Build a query with a different target chain", async () => {
    const config: AxiomV2QueryBuilderConfig = {
      provider: process.env.PROVIDER_URI_SEPOLIA as string,
      caller: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
      targetChainId: 5,
      version: "v2",
    };
    const axiom = new AxiomV2QueryBuilder(config);
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

    await axiom.build();
    const builtQuery = axiom.getBuiltQuery();
    if (!builtQuery) {
      throw new Error("Query is not built");
    }

    expect(builtQuery.sourceChainId).toEqual("1");
    expect(builtQuery.targetChainId).toEqual("5");
    expect(builtQuery.queryHash).toEqual("0xda1933a884934070a870d18243ec2f1a7efa869966c4cf52d03b179c998a4825");
    expect(builtQuery.dataQueryHash).toEqual("0xfaaac492509be62a2026a769d31140ee49e4b662e56c95251b8ca6ccace0e91b");
    expect(builtQuery.dataQuery).toEqual("0x0000000000000001000200010115b5c00000000a00010115b6240000000a");
    expect(builtQuery.computeQuery.k).toEqual(0);
    expect(builtQuery.computeQuery.vkey.length).toEqual(0);
    expect(builtQuery.computeQuery.vkey).toEqual([]);
    expect(builtQuery.computeQuery.computeProof).toEqual("0x00");
  });
});
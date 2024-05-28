import { bytes32 } from "@axiom-crypto/tools";
import { 
  QueryBuilderBase,
  QueryBuilderBaseConfig,
  AxiomV2Callback,
  HeaderField,
} from "../../../src";

// Test coverage areas:
// - Crosschain

describe("Crosschain", () => {
  test("Build a query with a different target chain", async () => {
    const config: QueryBuilderBaseConfig = {
      rpcUrl: process.env.RPC_URL_SEPOLIA as string,
      targetChainId: 5,
      version: "v2",
    };
    const axiom = new QueryBuilderBase(config);
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

    await axiom.buildBase();
    const builtQuery = axiom.getBuiltQueryBase();
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
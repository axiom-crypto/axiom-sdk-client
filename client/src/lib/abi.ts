import { AbiType } from "../types";
import AxiomV2CoreAbi from "./abi/AxiomV2Core.json";
import AxiomV2QueryAbi from "./abi/AxiomV2Query.json";
import AxiomV2BroadcasterAbi from "./abi/AxiomV2Broadcaster.json";

export function getAxiomV2Abi(
  type: AbiType,
) {
  switch (type) {
    case AbiType.Core:
      return AxiomV2CoreAbi.abi;
    case AbiType.Query:
      return AxiomV2QueryAbi.abi;
    case AbiType.Broadcaster:
      return AxiomV2BroadcasterAbi.abi;
    default:
      throw new Error(`No ABI for AbiType ${type}`);
  }
}

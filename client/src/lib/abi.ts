import { AbiType } from "../types";
import AxiomV2QueryAbi from "./abi/AxiomV2Query.json";
import OptimismL1BlockAttributesAbi from "./abi/L1BlockAttributes.json";

export function getAxiomV2Abi(
  type: AbiType,
) {
  switch (type) {
    case AbiType.Query:
      return AxiomV2QueryAbi.abi;
    default:
      throw new Error(`No ABI for AbiType ${type}`);
  }
}

export function getOptimismL1BlockAttributesAbi() {
  return OptimismL1BlockAttributesAbi;
}
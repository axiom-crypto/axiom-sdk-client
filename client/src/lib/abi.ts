import { AbiType } from "../types";
import AxiomV2QueryAbi from "./abi/AxiomV2Query.json";

export function getAxiomAbi(
  type: AbiType,
) {
  switch (type) {
    case AbiType.Query:
      return AxiomV2QueryAbi.abi;
    default:
      throw new Error(`No ABI for AbiType ${type}`);
  }
}

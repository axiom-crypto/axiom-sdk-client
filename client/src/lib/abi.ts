import { AbiType } from "../types";
import AxiomV2QueryAbi from "./abi/AxiomV2Query.json";
import OpStackL1BlockAttributesAbi from "./abi/OpStackL1BlockAttributes.json";
import OpStackGasPriceOracleAbi from "./abi/OpStackGasPriceOracle.json";

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

export function getOpStackL1BlockAttributesAbi() {
  return OpStackL1BlockAttributesAbi;
}
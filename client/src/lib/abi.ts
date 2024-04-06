import AxiomV2QueryAbi from "./abi/AxiomV2Query.json";
import OpStackL1BlockAttributesAbi from "./abi/OpStackL1BlockAttributes.json";
import OpStackGasPriceOracleAbi from "./abi/OpStackGasPriceOracle.json";

export function getAxiomV2Abi() {
  return AxiomV2QueryAbi.abi;
}

export function getOpStackL1BlockAttributesAbi() {
  return OpStackL1BlockAttributesAbi;
}

export function getOpStackGasPriceOracleAbi() {
  return OpStackGasPriceOracleAbi;
}

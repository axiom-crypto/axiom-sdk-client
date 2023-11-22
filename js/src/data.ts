import { CircuitValue } from "@axiom-crypto/halo2-lib-js";
import { fetchDataQuery, getCircuitValue256Witness, getCircuitValueConstant, getCircuitValueWitness } from "./utils";
import { DataSubquery } from "@axiom-crypto/tools";

export const prepData = async (dataSubquery: DataSubquery, queryArr: CircuitValue[]) => {
  let val = await fetchDataQuery(globalThis.axiom.provider, dataSubquery, globalThis.axiom.results);
  globalThis.axiom.dataQuery.push(dataSubquery);
  let witness = getCircuitValue256Witness(val);
  let circuitType = getCircuitValueConstant(dataSubquery.type);

  let paddedQueryArr = [circuitType, ...queryArr];
  for (let i = queryArr.length; i < 13; i++) {
    paddedQueryArr.push(getCircuitValueWitness(0));
  }
  paddedQueryArr.push(witness.hi());
  paddedQueryArr.push(witness.lo());

  for (let queryCell of paddedQueryArr) {
    globalThis.axiom.halo2lib.make_public(globalThis.axiom.halo2wasm, queryCell.cell(), 1);
  }

  return witness;
};
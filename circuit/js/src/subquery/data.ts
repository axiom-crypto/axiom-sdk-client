import { CircuitValue } from "@axiom-crypto/halo2-lib-js";
import { getCircuitValue256Witness, getCircuitValueConstant, getCircuitValueWitness } from "../utils";
import { AccountSubquery, DataSubquery, DataSubqueryType, HeaderSubquery, ReceiptSubquery, SolidityNestedMappingSubquery, StorageSubquery, TxSubquery, getAccountFieldValue, getHeaderFieldValue, getReceiptFieldValue, getSolidityNestedMappingValue, getStorageFieldValue, getTxFieldValue } from "@axiom-crypto/tools";
import { JsonRpcProvider } from "ethers";

export const fetchDataQuery = async (provider: JsonRpcProvider, subquery: DataSubquery, results: { [key: string]: string }) => {
  let key = JSON.stringify(subquery.subqueryData);
  if (key in results) {
    return results[key];
  }

  switch (subquery.type) {
    case DataSubqueryType.Header:
      let header = await getHeaderFieldValue(provider, subquery.subqueryData as HeaderSubquery);
      if (header === null) throw new Error(`Failed to fetch header subquery: ${JSON.stringify(subquery.subqueryData)}`);
      results[key] = BigInt(header).toString();
      break;
    case DataSubqueryType.Account:
      let account = await getAccountFieldValue(provider, subquery.subqueryData as AccountSubquery);
      if (account === null) throw new Error(`Failed to fetch account subquery: ${JSON.stringify(subquery.subqueryData)}`);
      results[key] = BigInt(account).toString();
      break;
    case DataSubqueryType.Storage:
      let storage = await getStorageFieldValue(provider, subquery.subqueryData as StorageSubquery);
      if (storage === null) throw new Error(`Failed to fetch storage subquery: ${JSON.stringify(subquery.subqueryData)}`);
      results[key] = BigInt(storage).toString();
      break;
    case DataSubqueryType.Transaction:
      let tx = await getTxFieldValue(provider, subquery.subqueryData as TxSubquery);
      if (tx === null) throw new Error(`Failed to fetch tx subquery: ${JSON.stringify(subquery.subqueryData)}`);
      results[key] = BigInt(tx).toString();
      break;
    case DataSubqueryType.Receipt:
      let receipt = await getReceiptFieldValue(provider, subquery.subqueryData as ReceiptSubquery);
      if (receipt === null) throw new Error(`Failed to fetch receipt subquery: ${JSON.stringify(subquery.subqueryData)}`);
      results[key] = BigInt(receipt).toString();
      break;
    case DataSubqueryType.SolidityNestedMapping:
      let mapping = await getSolidityNestedMappingValue(provider, subquery.subqueryData as SolidityNestedMappingSubquery);
      if (mapping === null) throw new Error(`Failed to fetch solidity nested mapping subquery: ${JSON.stringify(subquery.subqueryData)}`);
      results[key] = BigInt(mapping).toString();
      break;
    default:
      throw new Error(`Invalid data subquery type: ${subquery.type}`);
  }

  return results[key];
}

export const fetchDataQueries = async (provider: JsonRpcProvider, dataQuery: DataSubquery[], cachedResults?: { [key: string]: string }) => {

  let results: { [key: string]: string } = {};
  for (let subquery of dataQuery) {
    await fetchDataQuery(provider, subquery, results);
  }
  return results;
}

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
import {
  getHeaderFieldValue,
  getAccountFieldValue,
  getStorageFieldValue,
  getTxFieldValue,
  getReceiptFieldValue,
  getSolidityNestedMappingValue,
  HeaderSubquery,
  AccountSubquery,
  StorageSubquery,
  TxSubquery,
  ReceiptSubquery,
  SolidityNestedMappingSubquery,
  BeaconValidatorSubquery,
  DataSubquery,
  DataSubqueryType,
} from "@axiom-crypto/tools";
import { JsonRpcProvider } from "ethers";
import { CircuitValue, convertInput, RawCircuitInput, CircuitValue256 } from "@axiom-crypto/halo2-lib-js";
import { Halo2LibWasm } from "@axiom-crypto/halo2-lib-js/wasm/web";

export type PrepData<T> = (subquery: T, subqueryCells: CircuitValue[]) => Promise<CircuitValue256>;

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

export const getCircuitValue256Witness = (halo2Lib: Halo2LibWasm, value: RawCircuitInput) => {
  let convertedVal = BigInt(value).toString(16).padStart(64, '0');
  let hi128 = convertedVal.slice(0, 32);
  let lo128 = convertedVal.slice(32);

  const hi128CircuitValue = new CircuitValue(halo2Lib, { cell: halo2Lib.witness(convertInput("0x" + hi128)) });
  const lo128CircuitValue = new CircuitValue(halo2Lib, { cell: halo2Lib.witness(convertInput("0x" + lo128)) });
  const halo2LibValue256 = new CircuitValue256(halo2Lib, { hi: hi128CircuitValue, lo: lo128CircuitValue });
  return halo2LibValue256;
}

export const getCircuitValueWitness = (halo2Lib: Halo2LibWasm, value: RawCircuitInput) => {
  const halo2LibValue = new CircuitValue(halo2Lib, { cell: halo2Lib.witness(convertInput(value)) });
  return halo2LibValue;
}

export const getCircuitValue256Constant = (halo2Lib: Halo2LibWasm, value: RawCircuitInput) => {
  let convertedVal = BigInt(value).toString(16).padStart(64, '0');
  let hi128 = convertedVal.slice(0, 32);
  let lo128 = convertedVal.slice(32);

  const hi128CircuitValue = new CircuitValue(halo2Lib, { cell: halo2Lib.constant(convertInput("0x" + hi128)) });
  const lo128CircuitValue = new CircuitValue(halo2Lib, { cell: halo2Lib.constant(convertInput("0x" + lo128)) });
  const halo2LibValue256 = new CircuitValue256(halo2Lib, { hi: hi128CircuitValue, lo: lo128CircuitValue });
  return halo2LibValue256;
}

export const getCircuitValueConstant = (halo2Lib: Halo2LibWasm, value: RawCircuitInput) => {
  const halo2LibValue = new CircuitValue(halo2Lib, { cell: halo2Lib.constant(convertInput(value)) });
  return halo2LibValue;
}

export const getCircuitValueWithOffset = (halo2Lib: Halo2LibWasm, value: CircuitValue, offset: RawCircuitInput) => {
  const cell = halo2Lib.add(value.cell(), halo2Lib.constant(Number(offset).toString()))
  const halo2LibValue = new CircuitValue(halo2Lib, { cell });
  return halo2LibValue;
}

export const isRawCircuitInput = (input: RawCircuitInput | CircuitValue | CircuitValue256) => {
  return typeof input === "string" || typeof input === "number" || typeof input === "bigint";
}

export const getCircuitValue256FromCircuitValue = (halo2Lib: Halo2LibWasm, value: CircuitValue) => {
  const b = BigInt(2) ** BigInt(128);
  const bCell = halo2Lib.constant(b.toString());
  const lookupBits = halo2Lib.lookup_bits();
  let paddedNumBits = Math.floor(253 / lookupBits) * lookupBits - 1;
  const cell = value.cell();
  const [hi, lo] = halo2Lib.div_mod_var(cell, bCell, paddedNumBits.toString(), "129")
  const hi128CircuitValue = new CircuitValue(halo2Lib, { cell: hi });
  const lo128CircuitValue = new CircuitValue(halo2Lib, { cell: lo });
  const halo2LibValue256 = new CircuitValue256(halo2Lib, { hi: hi128CircuitValue, lo: lo128CircuitValue });
  return halo2LibValue256;
}

export const lowercase = (str: string) => {
  return str.charAt(0).toLowerCase() + str.slice(1)
}

export const convertToBytes32 = (inputArray: Uint8Array) => {
  let result: string[] = [];
  for (let i = 0; i < inputArray.length; i += 32) {
    let slice = inputArray.slice(i, i + 32);
    let hex = Buffer.from(slice).toString('hex').padStart(64, '0');
    result.push(hex);
  }
  return result;
}

export const convertToBytes = (inputArray: Uint8Array): string => {
  let hex = Buffer.from(inputArray).toString('hex');
  return hex;
}

import { UnbuiltAccountSubquery, UnbuiltHeaderSubquery, UnbuiltSolidityNestedMappingSubquery, UnbuiltStorageSubquery, UnbuiltSubquery, UnbuiltTxSubquery } from "@axiom-crypto/core";
import { CircuitValue, convertRawInput, RawCircuitInput, CircuitValue256 } from "@axiom-crypto/halo2-lib-js";
import { DataSubquery, DataSubqueryType, ReceiptSubquery, TxSubquery, getBlockNumberAndTxIdx, getTxHash } from "@axiom-crypto/tools";
import { ethers } from "ethers";

export const getCircuitValue256Witness = (value: RawCircuitInput) => {
  let convertedVal = BigInt(value).toString(16).padStart(64, '0');
  let hi128 = convertedVal.slice(0, 32);
  let lo128 = convertedVal.slice(32);

  const hi128CircuitValue = new CircuitValue({ cell: globalThis.axiom.halo2lib.witness(convertRawInput("0x" + hi128)) });
  const lo128CircuitValue = new CircuitValue({ cell: globalThis.axiom.halo2lib.witness(convertRawInput("0x" + lo128)) });
  const halo2LibValue256 = new CircuitValue256({ hi: hi128CircuitValue, lo: lo128CircuitValue });
  return halo2LibValue256;
}

export const getCircuitValueWitness = (value: RawCircuitInput) => {
  const halo2LibValue = new CircuitValue({ cell: globalThis.axiom.halo2lib.witness(convertRawInput(value)) });
  return halo2LibValue;
}

export const getCircuitValue256Constant = (value: RawCircuitInput) => {
  let convertedVal = BigInt(value).toString(16).padStart(64, '0');
  let hi128 = convertedVal.slice(0, 32);
  let lo128 = convertedVal.slice(32);

  const hi128CircuitValue = new CircuitValue({ cell: globalThis.axiom.halo2lib.constant(convertRawInput("0x" + hi128)) });
  const lo128CircuitValue = new CircuitValue({ cell: globalThis.axiom.halo2lib.constant(convertRawInput("0x" + lo128)) });
  const halo2LibValue256 = new CircuitValue256({ hi: hi128CircuitValue, lo: lo128CircuitValue });
  return halo2LibValue256;
}

export const getCircuitValueConstant = (value: RawCircuitInput) => {
  const halo2LibValue = new CircuitValue({ cell: globalThis.axiom.halo2lib.constant(convertRawInput(value)) });
  return halo2LibValue;
}

export const getCircuitValueWithOffset = (value: CircuitValue, offset: RawCircuitInput) => {
  const cell = globalThis.axiom.halo2lib.add(value.cell(), globalThis.axiom.halo2lib.constant(Number(offset).toString()))
  const halo2LibValue = new CircuitValue({ cell });
  return halo2LibValue;
}

export const isRawCircuitInput = (input: RawCircuitInput | CircuitValue | CircuitValue256) => {
  return typeof input === "string" || typeof input === "number" || typeof input === "bigint";
}

export const getCircuitValue256FromCircuitValue = (value: CircuitValue) => {
  const [hi, lo] = globalThis.axiom.halo2lib.to_hi_lo(value.cell());
  const hi128CircuitValue = new CircuitValue({ cell: hi });
  const lo128CircuitValue = new CircuitValue({ cell: lo });
  const halo2LibValue256 = new CircuitValue256({ hi: hi128CircuitValue, lo: lo128CircuitValue });
  return halo2LibValue256;
}

export const lowercase = (str: string) => {
  return str.charAt(0).toLowerCase() + str.slice(1)
}

export const convertToBytes32 = (inputArray: Uint8Array) => {
  let result: string[] = [];
  for (let i = 0; i < inputArray.length; i += 32) {
    let slice = inputArray.slice(i, i + 32);
    let hex = "0x" + Buffer.from(slice).toString('hex').padStart(64, '0');
    result.push(hex);
  }
  return result;
}

export const convertToBytes = (inputArray: Uint8Array): string => {
  let hex = Buffer.from(inputArray).toString('hex');
  return hex;
}

export const byteArrayToBase64 = (byteArray: Uint8Array) => {
  return Buffer.from(byteArray).toString('base64');
}

export const base64ToByteArray = (base64: string): Uint8Array => {
  return Buffer.from(base64, 'base64');
}

export function resizeArray<T>(arr: T[], size: number, defaultValue: T): T[] {
  if (arr.length < size) {
    return arr.concat(Array(size - arr.length).fill(defaultValue));
  }
  return arr.slice(0, size);
}

export async function convertBuiltSubqueries(provider: string, builtSubqueries: DataSubquery[]): Promise<UnbuiltSubquery[]> {
  let unbuiltSubqueries: UnbuiltSubquery[] = [];
  const jsonRpcProvider = new ethers.JsonRpcProvider(provider);
  for (const builtSubquery of builtSubqueries) {
    let unbuiltSubquery: {[key: string]: any} = {};
    const type = builtSubquery.type;
    switch (type) {
      case DataSubqueryType.Header:
        unbuiltSubquery = builtSubquery.subqueryData as UnbuiltHeaderSubquery;
        unbuiltSubqueries.push(unbuiltSubquery);
        break;
      case DataSubqueryType.Account:
        unbuiltSubquery = builtSubquery.subqueryData as UnbuiltAccountSubquery;
        unbuiltSubqueries.push(unbuiltSubquery);
        break;
      case DataSubqueryType.Storage:
        unbuiltSubquery = builtSubquery.subqueryData as UnbuiltStorageSubquery;
        unbuiltSubqueries.push(unbuiltSubquery);
        break;
      case DataSubqueryType.Transaction: 
        let builtTxData = builtSubquery.subqueryData as TxSubquery;
        const txHashTx = await getTxHash(jsonRpcProvider, builtTxData.blockNumber, builtTxData.txIdx)
        if (txHashTx === null) {
          throw new Error(`Transaction at block ${builtTxData.blockNumber} and index ${builtTxData.txIdx} not found`);
        }
        unbuiltSubquery = {
          txHash: txHashTx,
          fieldOrCalldataIdx: builtTxData.fieldOrCalldataIdx,
        }
        unbuiltSubqueries.push(unbuiltSubquery);
        break;
      case DataSubqueryType.Receipt:
        let builtData = builtSubquery.subqueryData as ReceiptSubquery;
        const txHashRc = await getTxHash(jsonRpcProvider, builtData.blockNumber, builtData.txIdx)
        if (txHashRc === null) {
          throw new Error(`Transaction at block ${builtData.blockNumber} and index ${builtData.txIdx} not found`);
        }
        unbuiltSubquery = {
          txHash: txHashRc,
          fieldOrLogIdx: builtData.fieldOrLogIdx,
          topicOrDataOrAddressIdx: builtData.topicOrDataOrAddressIdx,
          eventSchema: builtData.eventSchema
        }
        unbuiltSubqueries.push(unbuiltSubquery);
        break;
      case DataSubqueryType.SolidityNestedMapping:
        unbuiltSubquery = builtSubquery.subqueryData as UnbuiltSolidityNestedMappingSubquery;
        unbuiltSubqueries.push(unbuiltSubquery);
        break;
      default:
        throw new Error(`Invalid subquery type: ${type}`);
    }
  }
  return unbuiltSubqueries;
}
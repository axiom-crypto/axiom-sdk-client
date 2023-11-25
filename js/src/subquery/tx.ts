import { AxiomV2FieldConstant, DataSubqueryType, TxField, TxSubquery } from "@axiom-crypto/tools";
import { CircuitValue, RawCircuitInput, CircuitValue256 } from "@axiom-crypto/halo2-lib-js";
import { getCircuitValueConstant, getCircuitValueWithOffset, lowercase } from "../utils";
import { prepData } from "./data";

enum SpecialTxFields {
  Type = 51,
  BlockNumber = 52,
  TxIdx = 53,
  FunctionSelector = 54
}
type SpecialTxKeys = Uncapitalize<keyof typeof SpecialTxFields>;
type SpecialTxKeyFields = {
  [key in SpecialTxKeys]: () => Promise<CircuitValue256>;
};

type TxEnumKeys = Uncapitalize<keyof typeof TxField>;
type TxEnumKeyFields = {
  [key in TxEnumKeys]: () => Promise<CircuitValue256>;
};

interface BaseTx extends TxEnumKeyFields { };
interface SpecialTx extends SpecialTxKeyFields { };
export interface Tx extends BaseTx, SpecialTx {
  /**
   * Retrieves a 32 byte chunk of the transaction calldata.
   *
   * @param calldataIdx - The index of the 32 byte chunk
   * @returns A `CircuitValue256` in representing the 32 byte chunk of the tx calldata.
   */
  calldata: (calldataIdx: CircuitValue | RawCircuitInput) => Promise<CircuitValue256>;

  /**
   * Retrieves a 32 byte chunk of a contract deployment's transaction data.
   *
   * @param contractDataIdx - The index of the 32 byte chunk
   * @returns A `CircuitValue256` in representing the 32 byte chunk of the contract deploy data.
   */
  contractData: (contractDataIdx: CircuitValue | RawCircuitInput) => Promise<CircuitValue256>;
};

export const buildTx = (blockNumber: CircuitValue, txIdx: CircuitValue) => {

  const halo2Lib = globalThis.axiom.halo2lib;

  const getSubquery = (fieldOrCalldataIdx: CircuitValue) => {
    let TxSubquery: TxSubquery = {
      blockNumber: blockNumber.number(),
      txIdx: txIdx.number(),
      fieldOrCalldataIdx: fieldOrCalldataIdx.number()
    };
    const dataSubquery = { subqueryData: TxSubquery, type: DataSubqueryType.Transaction };
    return prepData(dataSubquery, [blockNumber, txIdx, fieldOrCalldataIdx]);
  }

  const functions = Object.fromEntries(
    Object.keys(TxField).map((key) => {
      return [lowercase(key), () => {
        const txField = getCircuitValueConstant(TxField[key as keyof typeof TxField]);
        return getSubquery(txField);
      }]
    })
  ) as BaseTx;

  const specialFunctions = Object.fromEntries(
    Object.keys(SpecialTxFields).map((key) => {
      return [lowercase(key), () => {
        const txField = getCircuitValueConstant(SpecialTxFields[key as keyof typeof SpecialTxFields]);
        return getSubquery(txField);
      }]
    })
  ) as SpecialTx;

  const calldata = async (calldataIdx: CircuitValue | RawCircuitInput) => {
    if (typeof calldataIdx === "string" || typeof calldataIdx === "number" || typeof calldataIdx == "bigint") {
      calldataIdx = getCircuitValueConstant(calldataIdx);
    }
    const logIdxProcessed = getCircuitValueWithOffset(calldataIdx, AxiomV2FieldConstant.Tx.CalldataIdxOffset);
    return getSubquery(logIdxProcessed);
  }

  const contractData = async (contractDataIdx: CircuitValue | RawCircuitInput) => {
    if (typeof contractDataIdx === "string" || typeof contractDataIdx === "number" || typeof contractDataIdx == "bigint") {
      contractDataIdx = getCircuitValueConstant(contractDataIdx);
    }
    const logIdxProcessed = getCircuitValueWithOffset(contractDataIdx, AxiomV2FieldConstant.Tx.ContractDataIdxOffset);
    return getSubquery(logIdxProcessed);
  }

  const allFunctions: Tx = { ...functions, ...specialFunctions, calldata, contractData };

  return Object.freeze(allFunctions);
}

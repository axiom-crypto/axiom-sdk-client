import { AxiomV2FieldConstant, DataSubqueryType, ReceiptField, ReceiptSubquery } from "@axiom-crypto/tools";
import { CircuitValue, RawCircuitInput, CircuitValue256 } from "@axiom-crypto/halo2-lib-js";
import { getCircuitValue256Constant, getCircuitValueConstant, getCircuitValueWithOffset, lowercase } from "./utils";
import { prepData } from "./data";

/**
 * Represents a log entry in a receipt.
 */
export interface Log {
  /**
   * Retrieves the value of a specific topic in the log entry.
   *
   * @param topicIdx - The index of the topic.
   * @param eventSchema - The event schema.
   * @returns A `CircuitValue` representing the value of the topic.
   */
  topic: (topicIdx: RawCircuitInput | CircuitValue, eventSchema?: string | CircuitValue256) => Promise<CircuitValue256>;

  /**
   * Retrieves the address a log was emitted from
   *
   * @returns A `CircuitValue` representing `Log.address`.
   */
  address: () => Promise<CircuitValue256>;

  /**
   * Retrieves a 32 byte chunk of a log's data field.
   *
   * @param dataIdx - The index of the 32 byte chunk
   * @returns A `CircuitValue256` representing the 32 byte chunk of the log data.
   */
  data: (dataIdx: CircuitValue | RawCircuitInput, eventSchema?: string | CircuitValue256) => Promise<CircuitValue256>;
}

type ReceiptEnumKeys = Uncapitalize<keyof typeof ReceiptField>;
type ReceiptEnumKeyFieldsUnfiltered = { [key in ReceiptEnumKeys]: () => Promise<CircuitValue256> };
type ReceiptEnumKeyFields = Omit<ReceiptEnumKeyFieldsUnfiltered, "logs" | "postState" | "logsBloom">;

enum SpecialReceiptField {
  TxType = 51,
  BlockNumber = 52,
  TxIdx = 53,
}
type SpecialReceiptKeys = Uncapitalize<keyof typeof SpecialReceiptField>;
type SpecialReceiptKeyFields = {
  [key in SpecialReceiptKeys]: () => Promise<CircuitValue256>;
};

/**
 * Represents a receipt.
 */
export interface Receipt extends ReceiptEnumKeyFields, SpecialReceiptKeyFields {
  /**
   * Retrieves a log entry in the receipt.
   *
   * @param logIdx - The index of the log entry.
   * @returns A `Log` object representing the log entry.
   */
  log: (logIdx: RawCircuitInput | CircuitValue) => Log;

  /**
   * Retrieves a 32 byte chunk of the logs bloom.
   *
   * @param logsBloomIdx - The index of the 32 byte chunk in [0,8)
   * @returns A `CircuitValue256` representing the 32 byte chunk of the logs bloom.
   */
  logsBloom: (logsBloomIdx: RawCircuitInput) => Promise<CircuitValue256>;
};

export const buildReceipt = (blockNumber: CircuitValue, txIdx: CircuitValue) => {

  const getSubquery = (fieldOrLog: CircuitValue, topicOrData: CircuitValue, eventSchema: CircuitValue256) => {

    let receiptSubquery: ReceiptSubquery = {
      blockNumber: blockNumber.number(),
      txIdx: txIdx.number(),
      fieldOrLogIdx: fieldOrLog.number(),
      topicOrDataOrAddressIdx: topicOrData.number(),
      eventSchema: eventSchema.hex(),
    };
    const dataSubquery = { subqueryData: receiptSubquery, type: DataSubqueryType.Receipt };
    return prepData(dataSubquery, [blockNumber, txIdx, fieldOrLog, topicOrData, eventSchema.hi(), eventSchema.lo()]);
  }

  const log = (logIdx: RawCircuitInput | CircuitValue) => {
    if (typeof logIdx === "string" || typeof logIdx === "number" || typeof logIdx == "bigint") {
      logIdx = getCircuitValueConstant(logIdx);
    }
    const logIdxProcessed = getCircuitValueWithOffset(logIdx, AxiomV2FieldConstant.Receipt.LogIdxOffset);
    const topic = (topicIdx: RawCircuitInput | CircuitValue, eventSchema?: string | CircuitValue256) => {
      if (typeof eventSchema === "string") {
        eventSchema = getCircuitValue256Constant(eventSchema);
      }
      if (eventSchema === undefined) {
        eventSchema = getCircuitValue256Constant(0);
      }
      if (typeof topicIdx === "string" || typeof topicIdx === "number" || typeof topicIdx == "bigint") {
        topicIdx = getCircuitValueConstant(topicIdx);
      }
      return getSubquery(logIdxProcessed, topicIdx, eventSchema);
    }

    const address = async () => {
      const topicOrDataIdx = getCircuitValueConstant(AxiomV2FieldConstant.Receipt.AddressIdx);
      return getSubquery(logIdxProcessed, topicOrDataIdx, getCircuitValue256Constant(0))
    }

    const data = async (dataIdx: CircuitValue | RawCircuitInput, eventSchema?: string | CircuitValue256) => {
      if (typeof dataIdx === "string" || typeof dataIdx === "number" || typeof dataIdx == "bigint") {
        dataIdx = getCircuitValueConstant(dataIdx);
      }
      if (eventSchema === undefined) {
        eventSchema = getCircuitValue256Constant(0);
      }
      if (typeof eventSchema === "string") {
        eventSchema = getCircuitValue256Constant(eventSchema);
      }
      const dataIdxProcessed = getCircuitValueWithOffset(dataIdx, AxiomV2FieldConstant.Receipt.DataIdxOffset);
      return getSubquery(logIdxProcessed, dataIdxProcessed, eventSchema);
    }

    return Object.freeze({
      topic,
      address,
      data
    });
  }

  const functions = Object.fromEntries(
    Object.keys(ReceiptField).map((key) => {
      return [lowercase(key), () => {
        const receiptField = getCircuitValueConstant(ReceiptField[key as keyof typeof ReceiptField]);
        const zero = getCircuitValueConstant(0);
        const zeroCircuitValue256 = getCircuitValue256Constant(0);
        return getSubquery(receiptField, zero, zeroCircuitValue256);
      }]
    })
  ) as ReceiptEnumKeyFields;

  const specialFunctions = Object.fromEntries(
    Object.keys(SpecialReceiptField).map((key) => {
      return [lowercase(key), () => {
        const receiptField = getCircuitValueConstant(SpecialReceiptField[key as keyof typeof SpecialReceiptField]);
        const zero = getCircuitValueConstant(0);
        const zeroCircuitValue256 = getCircuitValue256Constant(0);
        return getSubquery(receiptField, zero, zeroCircuitValue256);
      }]
    })
  ) as SpecialReceiptKeyFields;

  const logsBloom = async (logsBloomIdxRaw: RawCircuitInput) => {

    if (logsBloomIdxRaw as any instanceof CircuitValue) {
      throw new Error("logsBloomIdxRaw must be a constant (not a CircuitValue)");
    }

    const logsBloomIdx = getCircuitValueConstant(logsBloomIdxRaw);

    if (logsBloomIdx.number() < 0 || logsBloomIdx.number() >= 8) {
      throw new Error("logsBloomIdx range is [0,8)");
    }
    const logIdxProcessed = getCircuitValueWithOffset(logsBloomIdx, AxiomV2FieldConstant.Receipt.LogsBloomIdxOffset);
    const zero = getCircuitValueConstant(0);
    const zeroCircuitValue256 = getCircuitValue256Constant(0);
    return getSubquery(logIdxProcessed, zero, zeroCircuitValue256);
  }

  const receipt: Receipt = {
    ...functions,
    ...specialFunctions,
    log,
    logsBloom
  };

  return Object.freeze(receipt);
}

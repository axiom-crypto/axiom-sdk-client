import { ethers } from "ethers";
import {
  bytes32,
  getBlockNumberAndTxIdx,
  encodeDataQuery,
  AxiomV2DataQuery,
  HeaderSubquery,
  AccountSubquery,
  StorageSubquery,
  TxSubquery,
  ReceiptSubquery,
  SolidityNestedMappingSubquery,
  Subquery,
} from "@axiom-crypto/tools";
import {
  DataSubquery,
  DataSubqueryType,
} from "../types";
import { getSubqueryTypeFromKeys } from "../utils";

/**
 * Formats Subquery[] into DataSubquery[]
 */
export function formatDataSubqueries(
  subqueries: Subquery[],
): DataSubquery[] {
  let dataSubqueries: DataSubquery[] = [];
  for (const subquery of subqueries) {
    const type = getSubqueryTypeFromKeys(Object.keys(subquery));
    let dataSubquery = formatDataSubquery(subquery, type);
    dataSubqueries.push(dataSubquery);
  }
  return dataSubqueries;
}

export function encodeBuilderDataQuery(chainId: number | string | bigint, allSubqueries: DataSubquery[]): string {
  return encodeDataQuery(chainId, allSubqueries);
}

export function formatDataQuery(chainId: number | string | bigint, allSubqueries: DataSubquery[]): AxiomV2DataQuery {
  const sourceChainId = chainId.toString();
  return {
    sourceChainId,
    subqueries: allSubqueries,
  };
}

export function formatDataSubquery(
  subquery: Subquery,
  type: DataSubqueryType,
): DataSubquery {
  switch (type) {
    case DataSubqueryType.Header:
      return formatDataSubqueryHeader(subquery as HeaderSubquery);
    case DataSubqueryType.Account:
      return formatDataSubqueryAccount(subquery as AccountSubquery);
    case DataSubqueryType.Storage:
      return formatDataSubqueryStorage(subquery as StorageSubquery);
    case DataSubqueryType.Transaction:
      return formatDataSubqueryTx(subquery as TxSubquery);
    case DataSubqueryType.Receipt:
      return formatDataSubqueryReceipt(subquery as ReceiptSubquery);
    case DataSubqueryType.SolidityNestedMapping:
      return formatDataSubquerySolidityNestedMapping(subquery as SolidityNestedMappingSubquery);
    default:
      throw new Error(`Invalid data subquery type: ${type}`);
  }
}

function formatDataSubqueryHeader(subquery: HeaderSubquery): DataSubquery {
  if (subquery.blockNumber === undefined) {
    throw new Error("Block number is required for Header subquery");
  }
  return {
    type: DataSubqueryType.Header,
    subqueryData: {
      blockNumber: subquery.blockNumber,
      fieldIdx: subquery.fieldIdx,
    } as HeaderSubquery,
  };
}

function formatDataSubqueryAccount(subquery: AccountSubquery): DataSubquery {
  if (subquery.blockNumber === undefined) {
    throw new Error("Block number is required for Account subquery");
  }
  return {
    type: DataSubqueryType.Account,
    subqueryData: {
      blockNumber: subquery.blockNumber,
      addr: subquery.addr.toLowerCase(),
      fieldIdx: subquery.fieldIdx,
    } as AccountSubquery,
  };
}

function formatDataSubqueryStorage(subquery: StorageSubquery): DataSubquery {
  if (subquery.blockNumber === undefined) {
    throw new Error("Block number is required for Storage subquery");
  }
  return {
    type: DataSubqueryType.Storage,
    subqueryData: {
      blockNumber: subquery.blockNumber,
      addr: subquery.addr.toLowerCase(),
      slot: subquery.slot,
    } as StorageSubquery,
  };
}

function formatDataSubqueryTx(subquery: TxSubquery): DataSubquery {
  if (subquery.blockNumber === undefined) {
    throw new Error("Block number is required for Tx subquery");
  }
  return {
    type: DataSubqueryType.Transaction,
    subqueryData: {
      blockNumber: subquery.blockNumber,
      txIdx: subquery.txIdx,
      fieldOrCalldataIdx: subquery.fieldOrCalldataIdx,
    } as TxSubquery,
  };
}

function formatDataSubqueryReceipt(subquery: ReceiptSubquery): DataSubquery {
  if (subquery.blockNumber === undefined) {
    throw new Error("Block number is required for Receipt subquery");
  }
  return {
    type: DataSubqueryType.Receipt,
    subqueryData: {
      blockNumber: subquery.blockNumber,
      txIdx: subquery.txIdx,
      fieldOrLogIdx: subquery.fieldOrLogIdx,
      topicOrDataOrAddressIdx: subquery.topicOrDataOrAddressIdx,
      eventSchema: subquery.eventSchema.toLowerCase(),
    } as ReceiptSubquery,
  };
}

function formatDataSubquerySolidityNestedMapping(
  subquery: SolidityNestedMappingSubquery,
): DataSubquery {
  if (subquery.blockNumber === undefined) {
    throw new Error("Block number is required for SolidityNestedMapping subquery");
  }
  return {
    type: DataSubqueryType.SolidityNestedMapping,
    subqueryData: {
      blockNumber: subquery.blockNumber,
      addr: subquery.addr.toLowerCase(),
      mappingSlot: subquery.mappingSlot,
      mappingDepth: subquery.mappingDepth,
      keys: subquery.keys.map((key) => bytes32(String(key).toLowerCase())),
    } as SolidityNestedMappingSubquery,
  };
}

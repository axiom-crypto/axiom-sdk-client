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

export function encodeBuilderDataQuery(chainId: number | string | BigInt, allSubqueries: DataSubquery[]): string {
  return encodeDataQuery(chainId, allSubqueries);
}

export function formatDataQuery(chainId: number | string | BigInt, allSubqueries: DataSubquery[]): AxiomV2DataQuery {
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
  return {
    type: DataSubqueryType.Header,
    subqueryData: {
      blockNumber: subquery.blockNumber,
      fieldIdx: subquery.fieldIdx,
    },
  };
}

function formatDataSubqueryAccount(subquery: AccountSubquery): DataSubquery {
  return {
    type: DataSubqueryType.Account,
    subqueryData: {
      blockNumber: subquery.blockNumber,
      addr: subquery.addr.toLowerCase(),
      fieldIdx: subquery.fieldIdx,
    },
  };
}

function formatDataSubqueryStorage(subquery: StorageSubquery): DataSubquery {
  return {
    type: DataSubqueryType.Storage,
    subqueryData: {
      blockNumber: subquery.blockNumber,
      addr: subquery.addr.toLowerCase(),
      slot: subquery.slot,
    },
  };
}

function formatDataSubqueryTx(subquery: TxSubquery): DataSubquery {
  return {
    type: DataSubqueryType.Transaction,
    subqueryData: {
      blockNumber: subquery.blockNumber,
      txIdx: subquery.txIdx,
      fieldOrCalldataIdx: subquery.fieldOrCalldataIdx,
    },
  };
}

function formatDataSubqueryReceipt(subquery: ReceiptSubquery): DataSubquery {
  return {
    type: DataSubqueryType.Receipt,
    subqueryData: {
      blockNumber: subquery.blockNumber,
      txIdx: subquery.txIdx,
      fieldOrLogIdx: subquery.fieldOrLogIdx,
      topicOrDataOrAddressIdx: subquery.topicOrDataOrAddressIdx,
      eventSchema: subquery.eventSchema.toLowerCase(),
    },
  };
}

function formatDataSubquerySolidityNestedMapping(
  subquery: SolidityNestedMappingSubquery,
): DataSubquery {
  return {
    type: DataSubqueryType.SolidityNestedMapping,
    subqueryData: {
      blockNumber: subquery.blockNumber,
      addr: subquery.addr.toLowerCase(),
      mappingSlot: subquery.mappingSlot,
      mappingDepth: subquery.mappingDepth,
      keys: subquery.keys.map((key) => bytes32(String(key).toLowerCase())),
    },
  };
}

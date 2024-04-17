import { ethers } from "ethers";

import {
  AxiomV2ComputeQuery,
  AxiomV2DataQuery,
} from "@axiom-crypto/tools";

export {
  AxiomV2Callback,
  AxiomV2ComputeQuery,
  AxiomV2DataQuery,
  AxiomV2FeeData,
  DataSubquery,
  HeaderSubquery,
  AccountSubquery,
  StorageSubquery,
  TxSubquery,
  ReceiptSubquery,
  Subquery,
  SolidityNestedMappingSubquery,
  BeaconValidatorSubquery,
  DataSubqueryType,
  HeaderField,
  AccountField,
  TxField,
  ReceiptField,
  AxiomV2CircuitConstant,
  AxiomV2FieldConstant,
} from "@axiom-crypto/tools";

export interface QueryBuilderBaseConfig {
  providerUri: string;
  sourceChainId?: number | string | bigint;
  targetChainId?: number | string | bigint;
  version?: string;
  mock?: boolean;
}

export interface QueryBuilderBaseInternalConfig {
  providerUri: string;
  sourceChainId: bigint;
  targetChainId: bigint;
  mock: boolean;
  provider: ethers.JsonRpcProvider;
  version: string;
}

export interface BuiltQueryV2Base {
  sourceChainId: string;
  targetChainId: string;
  queryHash: string;
  dataQuery: string;
  dataQueryHash: string;
  dataQueryStruct: AxiomV2DataQuery;
  computeQuery: AxiomV2ComputeQuery;
  querySchema: string;
}

export interface DataSubqueryCount {
  total: number;
  header: number;
  account: number;
  storage: number;
  transaction: number;
  receipt: number;
  solidityNestedMapping: number;
}

import { ethers } from "ethers";

import {
  AxiomV2Callback,
  AxiomV2ComputeQuery,
  AxiomV2DataQuery,
  AxiomV2FeeData,
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

export interface AxiomV2QueryBuilderBaseConfig {
  providerUri: string;
  caller?: string;
  refundee?: string;
  sourceChainId?: number | string | BigInt;
  targetChainId?: number | string | BigInt;
  version?: string;
  mock?: boolean;
}

export interface QueryBuilderBaseInternalConfig {
  providerUri: string;
  sourceChainId: BigInt;
  targetChainId: BigInt;
  mock: boolean;
  provider: ethers.JsonRpcProvider;
  version: string;
}

export interface AxiomV2QueryOptions {
  maxFeePerGas?: string;
  callbackGasLimit?: number;
  overrideAxiomQueryFee?: string;
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

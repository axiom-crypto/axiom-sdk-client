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

export interface AxiomV2QueryBuilderConfig {
  provider: string;
  chainId?: number | string | BigInt;
  targetChainId?: number | string | BigInt;
  version?: string;
  privateKey?: string;
  mock?: boolean;
}

export interface InternalConfig {
  providerUri: string;
  chainId: BigInt;
  targetChainId: BigInt;
  mock: boolean;
  provider: ethers.JsonRpcProvider;
  version: string;
  signer?: ethers.Wallet;
}

export interface AxiomV2QueryOptions {
  maxFeePerGas?: string;
  callbackGasLimit?: number;
  overrideAxiomQueryFee?: string;
  refundee?: string;
}

export interface BuiltQueryV2 {
  sourceChainId: string;
  targetChainId: string;
  queryHash: string;
  dataQuery: string;
  dataQueryHash: string;
  dataQueryStruct: AxiomV2DataQuery;
  computeQuery: AxiomV2ComputeQuery;
  querySchema: string;
  callback: AxiomV2Callback;
  userSalt: string;
  feeData: AxiomV2FeeData;
  refundee: string;
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

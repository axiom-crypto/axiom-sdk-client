import { AxiomV2Callback, AxiomV2ComputeQuery, AxiomV2DataQuery, AxiomV2FeeData } from "@axiom-crypto/tools";
import { 
  QueryBuilderBaseConfig, 
  BuiltQueryV2Base,
  QueryBuilderBaseInternalConfig,
} from "@axiom-crypto/circuit";

export interface QueryBuilderClientConfig extends QueryBuilderBaseConfig {
  caller?: string;
  refundee?: string;
}

export interface QueryBuilderClientInternalConfig extends QueryBuilderBaseInternalConfig {
  caller: string;
  refundee: string;
}

export interface BuiltQueryV2 extends BuiltQueryV2Base {
  querySchema: string;
  callback: AxiomV2Callback;
  userSalt: string;
  feeData: AxiomV2FeeData;
  refundee: string;
}
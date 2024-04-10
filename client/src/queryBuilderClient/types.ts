import { AxiomV2Callback, AxiomV2ComputeQuery, AxiomV2DataQuery, AxiomV2FeeData } from "@axiom-crypto/tools";
import { BuiltQueryV2Base } from "@axiom-crypto/circuit";

export interface BuiltQueryV2 extends BuiltQueryV2Base {
  querySchema: string;
  callback: AxiomV2Callback;
  userSalt: string;
  feeData: AxiomV2FeeData;
  refundee: string;
}
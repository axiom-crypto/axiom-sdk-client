import { 
  CircuitValue,
  CircuitValue256,
  constant,
  witness,
  getHeader,
  getAccount,
  getStorage,
  getReceipt,
  getTx,
  getSolidityMapping,
  addToCallback,
  add,
  mul,
  sub,
  div,
  mod,
  pow,
  neg,
  mulAdd,
  mulNot,
  assertBit,
  assertIsConst,
  innerProduct,
  and,
  or,
  not,
  dec,
  select,
  orAnd,
  bitsToIndicator,
  idxToIndicator,
  selectByIndicator,
  selectFromIdx,
  isZero,
  isEqual,
  numToBits,
  checkEqual,
  rangeCheck,
  checkLessThan,
  isLessThan,
  poseidon,
  value,
  log,
  ecdsaBenchmark,
  newCircuitValue256,
  loadBn254Fq,
  convertBn254FqToCircuitValue256,
  loadBn254G1,
  bn254G1Sum,
  bn254G1SubUnequal,
  loadBn254G2,
  bn254G2Sum,
  bn254PairingCheck,
  loadSecp256k1Pubkey,
} from "@axiom-crypto/client";

export const inputs = {
  address: "0x897dDbe14c9C7736EbfDC58461355697FbF70048",
  claimedBlockNumber: 9173677,
};
export type CircuitInputType = typeof inputs;
export interface CircuitInputs extends CircuitInputType { }
export interface CircuitValueInputs {
  address: CircuitValue;
  claimedBlockNumber: CircuitValue;
}
export const circuit = async ({
  address,
  claimedBlockNumber
}: CircuitValueInputs) => {

for (let i = 0; i < 7; i++) {
  const acct = getAccount(add(claimedBlockNumber, i), address);
  const balance = await acct.balance();
  addToCallback(balance);
}

;

};
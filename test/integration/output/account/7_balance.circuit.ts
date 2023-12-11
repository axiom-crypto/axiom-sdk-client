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



};
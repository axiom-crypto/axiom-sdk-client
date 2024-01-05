import {
CircuitValue,
CircuitValue256,
getAccount,
addToCallback,
add,
or,
} from "@axiom-crypto/client";

export const inputs = {
"address":"0xB392448932F6ef430555631f765Df0dfaE34efF3","claimedBlockNumber":4917000
};
export type CircuitInputType = typeof inputs;
export interface CircuitInputs extends CircuitInputType { }
export interface CircuitValueInputs {
  address: CircuitValue;
  claimedBlockNumber: CircuitValue;
}
export const circuit = async ({
  address,
  claimedBlockNumber,
}: CircuitValueInputs) => {

  for (let i = 0; i < 7; i++) {
    const acct = getAccount(add(claimedBlockNumber, i), address);
    const balance = await acct.balance();
    addToCallback(balance);
  }
  
  
  
};
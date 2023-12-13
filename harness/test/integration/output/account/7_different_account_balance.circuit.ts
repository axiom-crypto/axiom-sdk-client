import {
CircuitValue,
CircuitValue256,
constant,
getAccount,
addToCallback,
add,
or,
} from "@axiom-crypto/client";

export const inputs = {
  // $input
};
export type CircuitInputType = typeof inputs;
export interface CircuitInputs extends CircuitInputType { }
export interface CircuitValueInputs {
  // $typeInputs
}
export const circuit = async ({
  // $cvInputs
}: CircuitValueInputs) => {

  const blockNumber = constant(1000000);
  for (let i = 0; i < 7; i++) {
    const acct = getAccount(blockNumber, "0x" + i.toString(16));
    addToCallback(await acct.balance());
  }
  
};
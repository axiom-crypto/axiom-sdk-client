import {
CircuitValue,
CircuitValue256,
getStorage,
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

  const blockNumber = 1000000;
  for (let i = 0; i < 7; i++) {
    const acct = getStorage(add(blockNumber, i), "0x" + i.toString(16));
    addToCallback(await acct.slot(i));
  }
  
};
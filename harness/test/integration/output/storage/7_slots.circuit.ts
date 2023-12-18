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

  const blockNumber = 5000000;
  for (let i = 0; i < 7; i++) {
    const acct = getStorage(add(blockNumber, i), "0xc76531Bb08e8E266E4eB8a988D314AA6650292af");
    addToCallback(await acct.slot(i));
  }
  
};
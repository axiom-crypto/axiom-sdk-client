import {
CircuitValue,
CircuitValue256,
getHeader,
addToCallback,
add,
or,
} from "@axiom-crypto/client";

export const inputs = {
    claimedBlockNumber: 9173677,
};
export type CircuitInputType = typeof inputs;
export interface CircuitInputs extends CircuitInputType { }
export interface CircuitValueInputs {
  claimedBlockNumber: CircuitValue;
}
export const circuit = async ({
    claimedBlockNumber,
}: CircuitValueInputs) => {

  for(let i=0; i<8; i++){
      const header = getHeader(add(9173677, i));
      addToCallback(await header.stateRoot())
  }
  
  
};
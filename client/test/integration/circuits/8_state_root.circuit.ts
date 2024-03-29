import {
CircuitValue,
CircuitValue256,
getHeader,
addToCallback,
add,
or,
} from "../../../src";

export const inputs = {
  "claimedBlockNumber": 3000000
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
      const header = getHeader(add(3000000, i));
      addToCallback(await header.stateRoot())
  }
  
  
};
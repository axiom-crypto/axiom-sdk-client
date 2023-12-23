import {
CircuitValue,
CircuitValue256,
getSolidityMapping,
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

  let mapping = getSolidityMapping(9730000, "0x8dde5d4a8384f403f888e1419672d94c570440c9", 1);
  for (let i = 0; i < 7; i++) {
    addToCallback(await mapping.key(i));
  }
  
};
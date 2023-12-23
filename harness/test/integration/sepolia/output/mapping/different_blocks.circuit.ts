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

  for (let i = 0; i < 7; i++) {
    let mapping = getSolidityMapping(4800000 + i, "0x1F98431c8aD98523631AE4a59f267346ea31F984", 4);
    addToCallback(await mapping.key(100));
  }
  
};
import {
CircuitValue,
CircuitValue256,
getTx,
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

  for (let i = 0; i < 8; i++) {
    let tx = getTx(9000000, i);
    addToCallback(await tx.r());
  }
  
};
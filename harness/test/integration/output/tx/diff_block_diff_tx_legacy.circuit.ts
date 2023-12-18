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
    let tx = getTx(8000000 + i, i); // 8000001 is legacy tx
    addToCallback(await tx.r());
  }
  
};
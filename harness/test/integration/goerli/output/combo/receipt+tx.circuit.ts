import {
CircuitValue,
CircuitValue256,
getReceipt,
getTx,
addToCallback,
add,
mul,
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
    let tx = getReceipt(9000050 + i, i);
    addToCallback(await tx.cumulativeGas());
  }
  
  for (let i = 0; i < 8; i++) {
    let tx = getTx(9000000 + i, 10 + i);
    addToCallback(await tx.r());
  }
  
};
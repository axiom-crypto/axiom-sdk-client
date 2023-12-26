import {
CircuitValue,
CircuitValue256,
getReceipt,
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

  for (let i = 0; i < 2; i++) {
    let tx = getReceipt(9000050 + i, i);
    await tx.blockNumber();
    await tx.cumulativeGas();
    await tx.txIdx();
    await tx.status();
  }
  
};
import { 
  CircuitValue,
  CircuitValue256,
  constant,
  witness,
  getHeader,
  getAccount,
  getStorage,
  getReceipt,
  getTx,
  getSolidityMapping,
  addToCallback,
  add,
  mul,
  sub,
  div,
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

for (let i = 0; i < 7; i++) {
  let mapping = getSolidityMapping(9730000 + i, "0x8dde5d4a8384f403f888e1419672d94c570440c9", 1);
  addToCallback(await mapping.key(2));
}

};
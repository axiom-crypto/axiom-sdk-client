import {
CircuitValue,
CircuitValue256,
constant,
getHeader,
getAccount,
getStorage,
getReceipt,
getTx,
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

  for (let i = 0; i < 32; i++) {
    let tx = getReceipt(9000050 + i, 0);
    addToCallback(await tx.status());
  }
  
  for (let i = 0; i < 16; i++) {
    let tx = getTx(9000000 + i, 10 + i);
    addToCallback(await tx.r());
  }
  for (let i = 0; i < 16; i++) {
    let tx = getTx(10000000, i);
    addToCallback((await tx.type()).toCircuitValue());
  }
  
  for (let i = 0; i < 16; i++) {
    let mapping = getSolidityMapping(9730000 + i, "0x8dde5d4a8384f403f888e1419672d94c570440c9", 1);
    addToCallback(await mapping.key(2));
  }
  
  const blockNumber = constant(5000000);
  for (let i = 0; i < 8; i++) {
    const acct = getStorage(add(blockNumber, i), "0xc76531Bb08e8E266E4eB8a988D314AA6650292af");
    addToCallback(await acct.slot(i));
  }
  
  for (let i = 0; i < 8; i++) {
    const acct = getAccount(6000000 + i, "0xeD64bC9802B1e86b94f5E78Cc100827431AcD732");
    addToCallback((await acct.nonce()).toCircuitValue());
  }
  
  for (let i = 0; i < 32; i++) {
    const header = getHeader(add(9173677, i));
    addToCallback(await header.stateRoot());
  }
  
};
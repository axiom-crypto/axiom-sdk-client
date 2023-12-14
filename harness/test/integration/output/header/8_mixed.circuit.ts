import {
CircuitValue,
CircuitValue256,
getHeader,
addToCallback,
add,
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

  const header = getHeader(claimedBlockNumber);
  addToCallback(await header.baseFeePerGas());
  addToCallback(await header.difficulty());
  addToCallback(await header.extraData());
  addToCallback(await header.timestamp());
  addToCallback(await header.miner());
  addToCallback(await header.mixHash());
  addToCallback(await header.nonce());
  addToCallback(await header.mixHash());
  
  
  
};
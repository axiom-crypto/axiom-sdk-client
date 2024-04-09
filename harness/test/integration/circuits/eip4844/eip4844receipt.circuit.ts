//$ chainId=1,11155111

import {
  CircuitValue,
  addToCallback,
  getAccount,
  getHeader,
  getReceipt,
  getSolidityMapping,
  getStorage,
  getTx,
  add,
  mul,
  constant,
} from "@axiom-crypto/client";

export interface CircuitInputs {
  blockNumber: CircuitValue;
  txIdx: CircuitValue;
}

export const defaultInputs = {
  blockNumber: 5005300, //$ tx.type["3"][0].blockNumber
  txIdx: 0, //$ tx.type["3"][0].txIdx
};

export const circuit =async (inputs: CircuitInputs) => {
  const tx = getReceipt(inputs.blockNumber, inputs.txIdx);
  const blockNum = await tx.blockNumber();
  addToCallback(blockNum);
}

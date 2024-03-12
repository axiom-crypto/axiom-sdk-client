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
} from "@axiom-crypto/circuit";

export interface CircuitInputs {
  blockNumber: CircuitValue;
  txIdx: CircuitValue;
}

export const defaultInputs = {
  blockNumber: 5005300,
  txIdx: 0,
};

export const circuit =async (inputs: CircuitInputs) => {
  const tx = getReceipt(inputs.blockNumber, inputs.txIdx);
  const blockNum = await tx.blockNumber();
  addToCallback(blockNum);
}

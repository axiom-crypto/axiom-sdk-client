import {
  add,
  addToCallback,
  CircuitValue,
  constant,
  getHeader,
  getReceipt,
  getSolidityMapping,
  getStorage,
  getTx,
  mul,
} from "@axiom-crypto/client";

export interface CircuitInputs {
  blockNumber: CircuitValue;
  txIdx: CircuitValue;
}

export const defaultInputs = {
  blockNumber: 4000000, //$ rc.events[3].blockNumber
  txIdx: 0, //$ rc.events[3].txIdx
};

export const circuit = async (inputs: CircuitInputs) => {
  for (let i = 0; i < 8; i++) {
    let tx = getReceipt(inputs.blockNumber.number(), inputs.txIdx);
    addToCallback(await tx.cumulativeGas());
  }

  for (let i = 0; i < 8; i++) {
    let tx = getTx(inputs.blockNumber.number() + i, 10 + i);
    addToCallback(await tx.r());
  }
}
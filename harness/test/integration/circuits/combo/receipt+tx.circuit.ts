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
  txBlockNumber: CircuitValue;
  txTxIdx: CircuitValue;
  rcBlockNumber: CircuitValue;
  rcTxIdx: CircuitValue;
}

export const defaultInputs = {
  txBlockNumber: 4000000, //$ tx.type["2"][3].blockNumber
  txTxIdx: 0, //$ tx.type["2"][3].txIdx
  rcBlockNumber: 4000000, //$ rc.events[3].blockNumber
  rcTxIdx: 0, //$ rc.events[3].txIdx
};

export const circuit = async (inputs: CircuitInputs) => {
  for (let i = 0; i < 8; i++) {
    let rc = getReceipt(inputs.rcBlockNumber, inputs.rcTxIdx);
    addToCallback(await rc.cumulativeGas());
  }

  for (let i = 0; i < 8; i++) {
    let tx = getTx(inputs.txBlockNumber, inputs.txTxIdx);
    addToCallback(await tx.r());
  }
}
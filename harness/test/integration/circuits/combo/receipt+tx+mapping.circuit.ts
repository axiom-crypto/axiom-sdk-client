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
  contract: CircuitValue;
  txBlockNumber: CircuitValue;
  txTxIdx: CircuitValue;
  rcBlockNumber: CircuitValue;
  rcTxIdx: CircuitValue;
}

export const defaultInputs = {
  blockNumber: 4000000, //$ account.eoa[7].blockNumber
  contract: "0xEaa455e4291742eC362Bc21a8C46E5F2b5ed4701", //$ storage.nonzero[7].address
  txBlockNumber: 4000000, //$ tx.type["2"][4].blockNumber
  txTxIdx: 0, //$ tx.type["2"][4].txIdx
  rcBlockNumber: 4000000, //$ rc.events[4].blockNumber
  rcTxIdx: 0, //$ rc.events[4].txIdx
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

  for (let i = 0; i < 7; i++) {
    let mapping = getSolidityMapping(add(inputs.blockNumber, i), inputs.contract, 1);
    addToCallback(await mapping.key(2));
  }
}
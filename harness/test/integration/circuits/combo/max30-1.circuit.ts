import {
  add,
  addToCallback,
  CircuitValue,
  getHeader,
  getReceipt,
  getSolidityMapping,
  getStorage,
  getTx,
} from "@axiom-crypto/client";

export interface CircuitInputs {
  blockNumber: CircuitValue;
  contract0: CircuitValue;
  storBlockNumber: CircuitValue;
  storAddress: CircuitValue;
  storSlot: CircuitValue;
  txBlockNumber: CircuitValue;
  txTxIdx: CircuitValue;
  rcBlockNumber: CircuitValue;
  rcTxIdx: CircuitValue;
}

export const defaultInputs = {
  blockNumber: 4000000, //$ account.eoa[3].blockNumber
  contract0: "0xEaa455e4291742eC362Bc21a8C46E5F2b5ed4701", //$ storage.nonzero[3].address
  storBlockNumber: 5000000, //$ storage.nonzero[4].blockNumber
  storAddress: "0x83c8c0b395850ba55c830451cfaca4f2a667a983", //$ storage.nonzero[4].address
  storSlot: 0, //$ storage.nonzero[4].slot
  txBlockNumber: 4000000, //$ tx.category.default[1].blockNumber
  txTxIdx: 0, //$ tx.category.default[1].txIdx
  rcBlockNumber: 4000000, //$ rc.events[1].blockNumber
  rcTxIdx: 0, //$ rc.events[1].txIdx
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

  for (let i = 0; i < 4; i++) {
    let mapping = getSolidityMapping(add(inputs.blockNumber, i), inputs.contract0, 1);
    addToCallback(await mapping.key(2));
  }

  for (let i = 0; i < 3; i++) {
    const acct = getStorage(add(inputs.storBlockNumber, i), inputs.storAddress);
    addToCallback(await acct.slot(inputs.storSlot));
  }

  for (let i = 0; i < 7; i++) {
    const header = getHeader(add(inputs.blockNumber, i));
    addToCallback(await header.stateRoot());
  }
}
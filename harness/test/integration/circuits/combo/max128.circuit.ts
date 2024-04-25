import {
  add,
  addToCallback,
  CircuitValue,
  constant,
  getAccount,
  getHeader,
  getReceipt,
  getSolidityMapping,
  getStorage,
  getTx,
  mul,
} from "@axiom-crypto/client";

export interface CircuitInputs {
  blockNumber: CircuitValue;
  eoa: CircuitValue;
  contractBlock0: CircuitValue;
  contractBlock1: CircuitValue;
  contract0: CircuitValue;
  contract1: CircuitValue;
  slot0: CircuitValue;
  slot1: CircuitValue;
  txBlockNumber: CircuitValue;
  txTxIdx: CircuitValue;
  rcBlockNumber: CircuitValue;
  rcTxIdx: CircuitValue;
}

export const defaultInputs = {
  blockNumber: 4000000, //$ account.eoa[5].blockNumber
  eoa: "0xEaa455e4291742eC362Bc21a8C46E5F2b5ed4701", //$ account.eoa[5].address
  contractBlock0: 4000000, //$ storage.nonzero[5].blockNumber
  contractBlock1: 4000000, //$ storage.nonzero[6].blockNumber
  contract0: "0xEaa455e4291742eC362Bc21a8C46E5F2b5ed4701", //$ storage.nonzero[5].address
  contract1: "0xEaa455e4291742eC362Bc21a8C46E5F2b5ed4701", //$ storage.nonzero[6].address
  slot0: 0, //$ storage.nonzero[5].slot
  slot1: 0, //$ storage.nonzero[6].slot
  txBlockNumber: 4000000, //$ tx.type["2"][0].blockNumber
  txTxIdx: 0, //$ tx.type["2"][0].txIdx
  rcBlockNumber: 4000000, //$ rc.events[0].blockNumber
  rcTxIdx: 0, //$ rc.events[0].txIdx
};

export const circuit = async (inputs: CircuitInputs) => {
  for (let i = 0; i < 32; i++) {
    let rc = getReceipt(inputs.rcBlockNumber, inputs.rcTxIdx);
    addToCallback(await rc.status());
  }

  for (let i = 0; i < 16; i++) {
    let tx = getTx(inputs.txBlockNumber, inputs.txTxIdx);
    addToCallback(await tx.r());
  }
  for (let i = 0; i < 16; i++) {
    let tx = getTx(inputs.txBlockNumber, inputs.txTxIdx);
    addToCallback((await tx.type()).toCircuitValue());
  }

  for (let i = 0; i < 16; i++) {
    let mapping = getSolidityMapping(add(inputs.blockNumber, i), inputs.contract0, 0);
    addToCallback(await mapping.key(2));
  }

  for (let i = 0; i < 8; i++) {
    const acct = getStorage(add(inputs.contractBlock1, i), inputs.contract1);
    addToCallback(await acct.slot(add(inputs.slot1, i)));
  }

  for (let i = 0; i < 8; i++) {
    const acct = getAccount(add(inputs.blockNumber, i), inputs.eoa);
    addToCallback((await acct.nonce()).toCircuitValue());
  }

  for (let i = 0; i < 32; i++) {
    const header = getHeader(add(inputs.blockNumber, i));
    addToCallback(await header.stateRoot());
  }
}
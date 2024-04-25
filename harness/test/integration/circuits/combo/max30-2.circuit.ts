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
  sub,
} from "@axiom-crypto/client";

export interface CircuitInputs {
  blockNumber: CircuitValue;
  contractBlock: CircuitValue;
  contract: CircuitValue;
  txBlockNumber: CircuitValue;
  txTxIdx: CircuitValue;
  rcBlockNumber: CircuitValue;
  rcTxIdx: CircuitValue;
}

export const defaultInputs = {
  blockNumber: 4000000, //$ account.eoa[4].blockNumber
  contractBlock: 4000000, //$ storage.nonzero[4].blockNumber
  contract: "0xEaa455e4291742eC362Bc21a8C46E5F2b5ed4701", //$ storage.nonzero[4].address
  txBlockNumber: 4000000, //$ tx.category.large[2].blockNumber
  txTxIdx: 0, //$ tx.category.large[2].txIdx
  rcBlockNumber: 4000000, //$ rc.events[2].blockNumber
  rcTxIdx: 0, //$ rc.events[2].txIdx
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
    let mapping = getSolidityMapping(add(inputs.contractBlock, i), inputs.contract, 1);
    addToCallback(await mapping.key(2));
  }

  for (let i = 0; i < 7; i++) {
    const header = getHeader(add(sub(inputs.blockNumber, 173677), i));
    addToCallback(await header.stateRoot());
  }
}
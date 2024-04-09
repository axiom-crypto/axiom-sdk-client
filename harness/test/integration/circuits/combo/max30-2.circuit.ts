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
  contractBlock: CircuitValue;
  contract: CircuitValue;
  rcBlockNumber: CircuitValue;
  rcTxIdx: CircuitValue;
}

export const defaultInputs = {
  blockNumber: 4000000, //$ account.eoa[4].blockNumber
  contractBlock: 4000000, //$ storage.nonzero[4].blockNumber
  contract: "0xEaa455e4291742eC362Bc21a8C46E5F2b5ed4701", //$ storage.nonzero[4].address
  rcBlockNumber: 4000000, //$ rc.events[0].blockNumber
  rcTxIdx: 10, //$ rc.events[0].txIndex
};

export const circuit = async (inputs: CircuitInputs) => {
  for (let i = 0; i < 8; i++) {
    let tx = getReceipt(inputs.rcBlockNumber, inputs.rcTxIdx);
    addToCallback(await tx.cumulativeGas());
  }

  for (let i = 0; i < 8; i++) {
    let tx = getTx(inputs.blockNumber.number() + i, 10 + i);
    addToCallback(await tx.r());
  }

  for (let i = 0; i < 7; i++) {
    let mapping = getSolidityMapping(inputs.contractBlock.number() + i, inputs.contract, 1);
    addToCallback(await mapping.key(2));
  }

  for (let i = 0; i < 7; i++) {
    const header = getHeader(add(inputs.blockNumber.number() - 173677, i));
    addToCallback(await header.stateRoot());
  }
}
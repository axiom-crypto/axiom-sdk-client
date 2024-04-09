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
  contractBlock0: CircuitValue;
  contractBlock1: CircuitValue;
  contractBlock2: CircuitValue;
  contract0: CircuitValue;
  contract1: CircuitValue;
  contract2: CircuitValue;
}

export const defaultInputs = {
  blockNumber: 4000000, //$ account.eoa[7].blockNumber
  contractBlock0: 4000000, //$ storage.nonzero[7].blockNumber
  contractBlock1: 4000000, //$ storage.nonzero[8].blockNumber
  contractBlock2: 4000000, //$ storage.nonzero[9].blockNumber
  contract0: "0xEaa455e4291742eC362Bc21a8C46E5F2b5ed4701", //$ storage.nonzero[7].address
  contract1: "0xEaa455e4291742eC362Bc21a8C46E5F2b5ed4701", //$ storage.nonzero[8].address
  contract2: "0xEaa455e4291742eC362Bc21a8C46E5F2b5ed4701", //$ storage.nonzero[9].address
};

export const circuit = async (inputs: CircuitInputs) => {
  for (let i = 0; i < 32; i++) {
    let tx = getReceipt(inputs.blockNumber.number() - 50 + i, 0);
    addToCallback(await tx.status());
  }

  for (let i = 0; i < 16; i++) {
    let tx = getTx(inputs.blockNumber.number() + i, 10 + i);
    addToCallback(await tx.r());
  }
  for (let i = 0; i < 16; i++) {
    let tx = getTx(inputs.blockNumber.number() - 1000000, i);
    addToCallback((await tx.type()).toCircuitValue());
  }

  for (let i = 0; i < 16; i++) {
    let mapping = getSolidityMapping(inputs.blockNumber.number() - 730000 + i, inputs.contract0, 1);
    addToCallback(await mapping.key(2));
  }

  for (let i = 0; i < 8; i++) {
    const acct = getStorage(add(inputs.blockNumber, i), inputs.contract1);
    addToCallback(await acct.slot(i));
  }

  for (let i = 0; i < 8; i++) {
    const acct = getAccount(inputs.blockNumber.number() - 400000 + i, inputs.contract2);
    addToCallback((await acct.nonce()).toCircuitValue());
  }

  for (let i = 0; i < 32; i++) {
    const header = getHeader(add(inputs.blockNumber, i));
    addToCallback(await header.stateRoot());
  }
}
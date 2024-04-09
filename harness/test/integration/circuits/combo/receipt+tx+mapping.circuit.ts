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
}

export const defaultInputs = {
  blockNumber: 4000000, //$ account.eoa[5].blockNumber
  contract: "0xEaa455e4291742eC362Bc21a8C46E5F2b5ed4701", //$ storage.nonzero[5].address
};

export const circuit = async (inputs: CircuitInputs) => {
  for (let i = 0; i < 8; i++) {
    let tx = getReceipt(inputs.blockNumber.number() - 50 + i, i);
    addToCallback(await tx.cumulativeGas());
  }

  for (let i = 0; i < 8; i++) {
    let tx = getTx(inputs.blockNumber.number() + i, 10 + i);
    addToCallback(await tx.r());
  }

  for (let i = 0; i < 7; i++) {
    let mapping = getSolidityMapping(inputs.blockNumber.number() - 205005 + i, inputs.contract, 1);
    addToCallback(await mapping.key(2));
  }
}
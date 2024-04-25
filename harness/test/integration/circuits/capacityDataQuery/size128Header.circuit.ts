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
}

export const defaultInputs = {
  blockNumber: 5000000, //$ account.eoa[1].blockNumber
}

export const circuit = async (inputs: CircuitInputs) => {
  for (let i = 0; i < 128; i++) {
    add(1,1);
    const header = await getHeader(add(inputs.blockNumber, i)).receiptsRoot();
    addToCallback(header);
  }
}
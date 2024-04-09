import {
  add,
  addToCallback,
  constant,
  getAccount,
  getHeader,
  getReceipt,
  getSolidityMapping,
  getStorage,
  getTx,
  mul,
} from "@axiom-crypto/client";

export interface CircuitInputs {}

export const defaultInputs = {};

export const circuit = async (inputs: CircuitInputs) => {
  const blockNumber = 5000000;
  for (let i = 0; i < 128; i++) {
    add(1,1);
    const header = await getHeader(blockNumber + i).receiptsRoot();
    addToCallback(header);
  }
}
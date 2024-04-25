import {
  addToCallback,
  CircuitValue,
  getHeader,
} from "@axiom-crypto/client";


export interface CircuitInputs {
  blockNumber: CircuitValue;
}

export const defaultInputs = {
  blockNumber: 5000000, //$ account.eoa[11].blockNumber
}

export const circuit = async (inputs: CircuitInputs) => {
  const header = await getHeader(inputs.blockNumber).number();
  addToCallback(header);
}
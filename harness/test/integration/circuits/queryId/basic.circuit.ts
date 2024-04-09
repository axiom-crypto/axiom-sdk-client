import {
  addToCallback,
  getHeader,
} from "@axiom-crypto/client";

export interface CircuitInputs {}

export const defaultInputs = {};

export const circuit = async (inputs: CircuitInputs) => {
  const header = await getHeader(5300000).number();
  addToCallback(header);
}
import { add, addToCallback, constant, mul } from "@axiom-crypto/circuit";

export interface CircuitInputs {}

export const defaultInputs = {};

export const circuit = async (inputs: CircuitInputs) => {
  let total = constant(0);
  for (let i = 0; i < 16; i++) {
    const a = constant(256);
    const b = constant(128);
    const c = mul(a, b);
    total = add(total, c);
  }
  addToCallback(total);
}
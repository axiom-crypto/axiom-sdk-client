import {
  CircuitValue,
  addToCallback,
  getAccount,
  getHeader,
  getReceipt,
  getSolidityMapping,
  getStorage,
  getTx,
  add,
  mul,
  constant,
} from "@axiom-crypto/circuit";

export interface CircuitInputs {
  blockNumber: CircuitValue;
}

export const defaultInputs = {
  blockNumber: 5100050,
};

export const config = {
  capacity: {
    maxOutputs: 256,
    maxSubqueries: 256,
  }
}

export const circuit = async (inputs: CircuitInputs) => {
  const addr = "0x83c8c0b395850ba55c830451cfaca4f2a667a983";
  for (let i = 0; i < 4; i++) {
    const header = await getHeader(add(inputs.blockNumber, constant(i))).timestamp();
    const account = await getAccount(add(inputs.blockNumber, constant(i)), addr).balance();
    const storage = await getStorage(add(inputs.blockNumber, constant(i)), addr).slot(0);
    const tx = await getTx(add(inputs.blockNumber, constant(i)), 0).to();
    const rc = await getReceipt(add(inputs.blockNumber, constant(i)), 0).status();
    const mapping = await getSolidityMapping(add(inputs.blockNumber, constant(i)), addr, 0).key(0);
    const r0 = add(header.toCircuitValue(), account.toCircuitValue());
    const r1 = add(r0, storage.toCircuitValue());
    const r2 = mul(tx.toCircuitValue(), mapping.toCircuitValue());
    const s = mul(rc.toCircuitValue(), r1);
    addToCallback(r2);
    addToCallback(s);
  }
}
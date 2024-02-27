import {
  CircuitValue,
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
} from "@axiom-crypto/circuit";

export interface CircuitInputs {
  blockNumber: CircuitValue;
}

export const defaultInputs = {
  blockNumber: 5100000,
};

export const circuit = async (inputs: CircuitInputs) => {
  const blockNumber = inputs.blockNumber.number();
  const addr = "0x83c8c0b395850ba55c830451cfaca4f2a667a983";
  for (let i = 0; i < 4; i++) {
    const header = await getHeader(blockNumber + i).timestamp();
    const account = await getAccount(blockNumber + i, addr).balance();
    const storage = await getStorage(blockNumber + i, addr).slot(0);
    const tx = await getTx(blockNumber + i, 0).to();
    const rc = await getReceipt(blockNumber + i, 0).status();
    const mapping = await getSolidityMapping(blockNumber + i, addr, 0).key(0);
    const r0 = add(header.toCircuitValue(), account.toCircuitValue());
    const r1 = add(r0, storage.toCircuitValue());
    const r2 = mul(tx.toCircuitValue(), mapping.toCircuitValue());
    const s = mul(rc.toCircuitValue(), r1);
    addToCallback(r2);
    addToCallback(s);
  }
}
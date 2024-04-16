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
} from "@axiom-crypto/client";

export interface CircuitInputs {
  blockNumber: CircuitValue;
  addr: CircuitValue;
  txBlockNumber: CircuitValue;
  txTxIdx: CircuitValue;
  rcBlockNumber: CircuitValue;
  rcTxIdx: CircuitValue;
}

export const defaultInputs = {
  blockNumber: 5100050, //$ account.eoa[10].blockNumber
  addr: "0x83c8c0b395850ba55c830451cfaca4f2a667a983", //$ account.contract[10].address
  txBlockNumber: 4000000, //$ tx.type["2"][6].blockNumber
  txTxIdx: 0, //$ tx.type["2"][6].txIdx
  rcBlockNumber: 4000000, //$ rc.events[6].blockNumber
  rcTxIdx: 0, //$ rc.events[6].txIdx
};

export const config = {
  capacity: {
    maxOutputs: 256,
    maxSubqueries: 256,
  }
}

export const circuit = async (inputs: CircuitInputs) => {
  for (let i = 0; i < 4; i++) {
    const header = await getHeader(add(inputs.blockNumber, constant(i))).timestamp();
    const account = await getAccount(add(inputs.blockNumber, constant(i)), inputs.addr).balance();
    const storage = await getStorage(add(inputs.blockNumber, constant(i)), inputs.addr).slot(0);
    const tx = await getTx(inputs.txBlockNumber, inputs.txTxIdx).to();
    const rc = await getReceipt(inputs.rcBlockNumber, inputs.rcTxIdx).status();
    const mapping = await getSolidityMapping(add(inputs.blockNumber, constant(i)), inputs.addr, 0).key(0);
    const r0 = add(header.toCircuitValue(), account.toCircuitValue());
    const r1 = add(r0, storage.lo());
    const r2 = mul(tx.toCircuitValue(), mapping.toCircuitValue());
    const s = mul(rc.toCircuitValue(), r1);
    addToCallback(r2);
    addToCallback(s);
  }
}

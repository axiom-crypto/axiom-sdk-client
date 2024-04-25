import {
  CircuitValue,
  getAccount,
  getHeader,
  getReceipt,
  getSolidityMapping,
  getStorage,
  getTx,
} from "@axiom-crypto/client";

export interface CircuitInputs {
  blockNumber: CircuitValue;
  address: CircuitValue;
  storBlockNumber: CircuitValue;
  storAddress: CircuitValue;
  storSlot: CircuitValue;
  txBlockNumber: CircuitValue;
  txTxIdx: CircuitValue;
  rcBlockNumber: CircuitValue;
  rcTxIdx: CircuitValue;
}

export const defaultInputs = {
  blockNumber: 5000000, //$ account.eoa[0].blockNumber
  address: "0x83c8c0b395850ba55c830451cfaca4f2a667a983", //$ account.eoa[0].address
  storBlockNumber: 5000000, //$ storage.nonzero[0].blockNumber
  storAddress: "0x83c8c0b395850ba55c830451cfaca4f2a667a983", //$ storage.nonzero[0].address
  storSlot: 0, //$ storage.nonzero[0].slot
  txBlockNumber: 4000000, //$ tx.type["0"][0].blockNumber
  txTxIdx: 0, //$ tx.type["0"][0].txIdx
  rcBlockNumber: 4000000, //$ rc.events[0].blockNumber
  rcTxIdx: 0, //$ rc.events[0].txIdx
};

export const circuit = async (inputs: CircuitInputs) => {
  const header = await getHeader(inputs.blockNumber).receiptsRoot();
  const account = await getAccount(inputs.blockNumber, inputs.address).balance();
  const storage = await getStorage(inputs.blockNumber, inputs.address).slot(0);
  const tx = await getTx(inputs.txBlockNumber, inputs.txTxIdx).to();
  const rc = await getReceipt(inputs.rcBlockNumber, inputs.rcTxIdx).status();
  const mapping = await getSolidityMapping(inputs.blockNumber, inputs.address, 0).key(0);
}
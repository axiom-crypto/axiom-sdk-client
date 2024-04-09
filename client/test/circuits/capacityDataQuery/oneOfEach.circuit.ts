import { add, addToCallback, constant, getAccount, getHeader, getReceipt, getSolidityMapping, getStorage, getTx, mul } from "@axiom-crypto/circuit";

export interface CircuitInputs {}

export const defaultInputs = {};

export const circuit = async (inputs: CircuitInputs) => {
  const blockNumber = 5000000;
  const addr = "0x83c8c0b395850ba55c830451cfaca4f2a667a983";
  const header = await getHeader(blockNumber).receiptsRoot();
  const account = await getAccount(blockNumber, addr).balance();
  const storage = await getStorage(blockNumber, addr).slot(0);
  const tx = await getTx(blockNumber, 0).to();
  const rc = await getReceipt(blockNumber, 0).status();
  const mapping = await getSolidityMapping(blockNumber, addr, 0).key(0);
}
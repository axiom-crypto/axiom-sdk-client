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
}

export const defaultInputs = {
  "blockNumber": 5000000, //$ account.eoa[0].blockNumber
  address: "0x83c8c0b395850ba55c830451cfaca4f2a667a983" //$ account.eoa[0].address
};

export const circuit = async (inputs: CircuitInputs) => {
  const header = await getHeader(inputs.blockNumber).receiptsRoot();
  const account = await getAccount(inputs.blockNumber, inputs.address).balance();
  const storage = await getStorage(inputs.blockNumber, inputs.address).slot(0);
  const tx = await getTx(inputs.blockNumber, 0).to();
  const rc = await getReceipt(inputs.blockNumber, 0).status();
  const mapping = await getSolidityMapping(inputs.blockNumber, inputs.address, 0).key(0);
}
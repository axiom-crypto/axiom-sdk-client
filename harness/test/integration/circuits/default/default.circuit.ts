import {
  add,
  sub,
  mul,
  div,
  checkLessThan,
  CircuitValue,
  CircuitValue256,
  constant,
  witness,
  addToCallback,
  getAccount,
  checkEqual,
  getHeader,
  getStorage,
  getSolidityMapping,
  getTx,
  getReceipt,
} from "@axiom-crypto/client";

// For type safety, define the input types to your circuit here.
// These should be the _variable_ inputs to your circuit. Constants can be hard-coded into the circuit itself.
export interface CircuitInputs {
  address: CircuitValue;
  claimedBlockNumber: CircuitValue;
  block: CircuitValue;
  addr: CircuitValue;
  txBlockNumber: CircuitValue;
  txIdx: CircuitValue;
  logIdx: CircuitValue;
  eventSchema: CircuitValue256;
  slot: CircuitValue256;
  mappingSlot: CircuitValue256;
}

export const defaultInputs = {
  address: "0xd45955f4de64f1840e5686e64278da901e263031", //$ account.eoa[0].address
  claimedBlockNumber: 8279568,  //$ account.eoa[0].blockNumber
  block: 8279568, //$ account.eoa[2].blockNumber
  addr: "0x256d75f227d6360e1456faed6694231f15a37871", //$ account.eoa[1].address
  txBlockNumber: 8279504, //$ rc.events[0].blockNumber
  txIdx: 14, //$ rc.events[0].txIdx
  logIdx: 6, //$ rc.events[0].logIdx
  eventSchema: "0x7c1fc233fcf8cadbae2477cb12888718dbcbca4a2c72cea0903b5aa7cf4a7e23", //$ rc.events[0].eventSchema
  slot: 0, //$ storage.nonzero[0].slot
  mappingSlot: 1, //$ tx.type["2"][0].txIdx
}

export const circuit = async (inputs: CircuitInputs) => {
  // example Axiom REPL circuit to prove the first block an account transacted
  // get the previous block number
  const prevBlock = sub(inputs.claimedBlockNumber, constant(1));

  //get the account at the previous block
  const accountPrevBlock = getAccount(prevBlock, inputs.address);

  // get the account nonce at the previous block and assert that it is 0
  const prevNonce = (await accountPrevBlock.nonce()).toCircuitValue();
  // checkEqual(prevNonce, constant(0))

  // get the account nonce at the claimed block number
  const account = getAccount(inputs.claimedBlockNumber, inputs.address);
  const currNonce = (await account.nonce()).toCircuitValue();

  //checks that currNonce > 0 at the claimed block
  // checkLessThan(constant(0), currNonce)

  // add the address and blockNumber to the callback, for it to be passed
  // as a result to the callback client contract
  addToCallback(inputs.address)
  addToCallback(inputs.claimedBlockNumber);

  // Here is a list of all functions you can use to fetch on-chain data in the REPL.
  // For more detailed docs and a list of all data and compute functions, see our 
  // preview docs at:
  //
  // https://docs.axiom.xyz/sdk-and-repl-reference/axiomrepl-reference
  //

  // fetch block header data
  let header = getHeader(inputs.block);
  // access the timestamp field
  let timestamp = await header.timestamp();
  // access the gasLimit field
  let gasLimit = await header.gasLimit();

  // fetch account data
  let acct = getAccount(inputs.block, inputs.addr);
  // access the account balance at `block`
  let balance = await acct.balance();
  // access the nonce of the account at `block`
  let nonce = await acct.nonce();

  // fetch storage data
  let storage = getStorage(inputs.block, inputs.addr);
  // access the value at storage slot `slot`
  let slotVal = await storage.slot(inputs.slot);

  // fetch Solidity mapping data
  let mapping = getSolidityMapping(inputs.block, inputs.addr, inputs.mappingSlot);
  // access the value in the mapping at `mappingSlot` with key `3`
  let mappingVal = await mapping.key(3);

  // fetch transaction data, example is for the transaction below:
  // https://goerli.etherscan.io/tx/0xa4f781ad033d6dab5b13e3ab7c7cbdbd0ea4c0a2be3d9ffa7ed1e53d2d5bcc46
  let tx = getTx(inputs.txBlockNumber, inputs.txIdx);
  // get the 4-byte function selector that was called
  let functionSelector = await tx.functionSelector();
  // access bytes [32, 64) of calldata
  // let calldata = await tx.calldata(1);

  let receipt = getReceipt(inputs.txBlockNumber, inputs.txIdx);
  // access the address that emitted the log event at index 0
  let logAddr = await receipt.log(inputs.logIdx).address();
  // access the topic at index 1 of the log event at index 0 and check it has schema eventSchema
  // because `address` is indexed in the event, this corresponds to `address`
  let topic = await receipt.log(inputs.logIdx).topic(1, inputs.eventSchema); 
  // access the first 32 bytes of data in the log event at index 0
  // because `amt` is not indexed, this corresponds to `amt`
  let data = await receipt.log(inputs.logIdx).data(0);

  addToCallback(logAddr);
  addToCallback(topic);
  addToCallback(data);
}
//
//                 _                 _____  ______ _____  _      
//     /\         (_)               |  __ \|  ____|  __ \| |     
//    /  \   __  ___  ___  _ __ ___ | |__) | |__  | |__) | |     
//   / /\ \  \ \/ / |/ _ \| '_ ` _ \|  _  /|  __| |  ___/| |     
//  / ____ \  >  <| | (_) | | | | | | | \ \| |____| |    | |____ 
// /_/    \_\/_/\_\_|\___/|_| |_| |_|_|  \_\______|_|    |______|
//                                                              
//                                                               

// example Axiom REPL circuit to prove the first block an account transacted
// get the previous block number
const prevBlock = sub(claimedBlockNumber, constant(1));

//get the account at the previous block
const accountPrevBlock = getAccount(prevBlock, address);

// get the account nonce at the previous block and assert that it is 0
const prevNonce = (await accountPrevBlock.nonce()).toCircuitValue();
checkEqual(prevNonce, constant(0))

// get the account nonce at the claimed block number
const account = getAccount(claimedBlockNumber, address);
const currNonce = (await account.nonce()).toCircuitValue();

//checks that currNonce > 0 at the claimed block
checkLessThan(constant(0), currNonce)

// add the address and blockNumber to the callback, for it to be passed
// as a result to the callback client contract
addToCallback(address)
addToCallback(claimedBlockNumber);

// Here is a list of all functions you can use to fetch on-chain data in the REPL.
// For more detailed docs and a list of all data and compute functions, see our 
// preview docs at:
//
// https://docs.axiom.xyz/sdk-and-repl-reference/axiomrepl-reference
//

// fetch block header data
let header = getHeader(block);
// access the timestamp field
let timestamp = await header.timestamp();
// access the gasLimit field
let gasLimit = await header.gasLimit();

// fetch account data
let acct = getAccount(block, addr);
// access the account balance at `block`
let balance = await acct.balance();
// access the nonce of the account at `block`
let nonce = await acct.nonce();

// fetch storage data
let storage = getStorage(block, addr);
// access the value at storage slot `slot`
let slotVal = await storage.slot(slot);

// fetch Solidity mapping data
let mapping = getSolidityMapping(block, addr, mappingSlot);
// access the value in the mapping at `mappingSlot` with key `3`
let mappingVal = await mapping.key(3);

// fetch transaction data, example is for the transaction below:
// https://goerli.etherscan.io/tx/0xa4f781ad033d6dab5b13e3ab7c7cbdbd0ea4c0a2be3d9ffa7ed1e53d2d5bcc46
let tx = getTx(txBlockNumber, txIdx);
// get the 4-byte function selector that was called
let functionSelector = await tx.functionSelector();
// access bytes [32, 64) of calldata
let calldata = await tx.calldata(1);

// fetch receipt data, example is for the first event log in the transaction below
// Deposit (index_topic_1 address payor, uint256 amt)
// https://goerli.etherscan.io/tx/0xa4f781ad033d6dab5b13e3ab7c7cbdbd0ea4c0a2be3d9ffa7ed1e53d2d5bcc46
// eventSchema = keccak(Deposit(address,uint256))
const eventSchema = "0xe1fffcc4923d04b559f4d29a8bfc6cda04eb5b0d3c460751c2402c5c5cc9109c";
let receipt = getReceipt(txBlockNumber, txIdx);
// access the address that emitted the log event at index 0
let logAddr = await receipt.log(0).address();
// access the topic at index 1 of the log event at index 0 and check it has schema eventSchema
// because `address` is indexed in the event, this corresponds to `address`
let topic = await receipt.log(0).topic(1, eventSchema); 
// access the first 32 bytes of data in the log event at index 0
// because `amt` is not indexed, this corresponds to `amt`
let data = await receipt.log(0).data(0);

const input = {
    address: "0x897dDbe14c9C7736EbfDC58461355697FbF70048",
    claimedBlockNumber: 9173677,
    block: 9730000,
    addr: "0x8dde5d4a8384f403f888e1419672d94c570440c9",
    txBlockNumber: 9728956,
    txIdx: 10,
    slot: 2,
    mappingSlot: 1
}
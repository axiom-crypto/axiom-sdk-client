import { ethers } from "ethers";
import dotenv from "dotenv";
import { getFullBlock, getRawReceipt, getNumBytes, objectToRlp, bytes32 } from "@axiom-crypto/tools";
import fs from 'fs';
import { AddressId, RcId, StorageId, TxId } from "./types";
dotenv.config();

// (Optional) End block to sample. 0 = current block.
const END_BLOCK = 0;

// Number of blocks to sample
const BLOCK_SAMPLES = 32;

// Interval between blocks to sample
const BLOCK_INTERVAL = 64;

// Block numbers to include in the search (useful if certain events happened at specific blocks)
const INCLUDE_BLOCKS: number[] = [
  // 8285121,
];

const provider = new ethers.JsonRpcProvider(process.env.PROVIDER_URI);

const IGNORE_ADDRS = [
  "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0001",
  "0x4200000000000000000000000000000000000007",
  "0x4200000000000000000000000000000000000015",
  "0x420000000000000000000000000000000000000f",
]

let data = {
  chainId: "0",
  blockRange: {
    start: 0,
    end: 0,
  },
  blockSamples: BLOCK_SAMPLES,
  blockInterval: BLOCK_INTERVAL,
  account: {
    eoa: [] as AddressId[],
    contract: [] as AddressId[],
  },
  storage: {
    nonzero: [] as StorageId[], // nonzero at slot 0
  },
  tx: {
    type: {
      "0": [] as TxId[],
      "1": [] as TxId[],
      "2": [] as TxId[],
      "3": [] as TxId[],
    },
    category: {
      "default": [] as TxId[], // 8192b, 4096b rlp
      "large": [] as TxId[], // 32768b, 16384b rlp
      "max": [] as TxId[], // 330000b, 131072b rlp
      "oversize": [] as TxId[], 
    },
  },
  rc: {
    category: {
      "default": [] as TxId[], // 800b, 20 logs
      "medium": [] as TxId[], // 1024b, 80 logs
      "large": [] as TxId[], // 2048b, 80 logs
      "max": [] as TxId[], // 1024b, 400 logs
      "oversize": [] as TxId[],
    },
    events: [] as RcId[],
  },
}

function pushArrayUpto<T>(arr: T[], itm: T, size: number = 32) {
  if (arr.length === size) {
    return;
  }
  arr.push(itm);
}

async function parseAccount(tx: any): Promise<string[]> {
  const accounts = [tx.from, tx.to];
  let contracts: string[] = [];
  for await (const account of accounts) {
    if (!account || IGNORE_ADDRS.includes(account)) {
      continue;
    }
    const code = await provider.getCode(account);
    if (code === '0x') {
      pushArrayUpto(data.account.eoa, {
        blockNumber: Number(tx.blockNumber),
        address: account
      });
    } else {
      pushArrayUpto(data.account.contract, {
        blockNumber: Number(tx.blockNumber),
        address: account
      });
      contracts.push(account);
    }
  }
  return contracts;
}

async function parseStorage(contracts: string[], blockNumber: string) {
  if (contracts.length === 0) {
    return;
  }
  for await (const contract of contracts) {
    // Random slot from 0 to 10
    const randomSlot = Math.floor(Math.random() * 11);
    const storage = await provider.getStorage(contract, randomSlot, blockNumber);
    if (storage !== bytes32(0)) {
      pushArrayUpto(data.storage.nonzero, {
        blockNumber: Number(blockNumber),
        address: contract,
        slot: randomSlot,
      });
    }
  }
}

async function parseTx(tx: any) {
  const type = Number(tx.type).toString() as keyof typeof data.tx.type;
  const txId: TxId = {
    hash: tx.hash,
    blockNumber: Number(tx.blockNumber),
    txIdx: Number(tx.transactionIndex),
  };
  if (!(type === "0" || type === "1" || type === "2" || type === "3")) {
    return;
  }
  pushArrayUpto(data.tx.type[type], txId);
  const numBytesTxData = getNumBytes(tx.input);
  // if (tx.accessList !== undefined && tx.accessList !== null && tx.accessList.length !== 0) {
  //   return;
  // }
  const accessListRlp = objectToRlp(tx.accessList ?? {});
  const aclNumBytesRlp = getNumBytes(accessListRlp);
  if (numBytesTxData < 8192 && aclNumBytesRlp < 800) {
    pushArrayUpto(data.tx.category.default, txId);
  } else if (numBytesTxData < 32768 && aclNumBytesRlp < 1024) {
    pushArrayUpto(data.tx.category.large, txId);
  } else if (numBytesTxData < 333000 && aclNumBytesRlp < 131072) {
    pushArrayUpto(data.tx.category.max, txId);
  } else {
    pushArrayUpto(data.tx.category.oversize, txId);
  }
  
}

async function parseReceipt(tx: any) {
  const receipt = await getRawReceipt(provider, tx.hash);
  const numLogs = receipt.logs.length;
  if (receipt.logs.length === 0) {
    return;
  }

  let maxLogDataSize = 0;
  for (let i = 0; i < numLogs; i++) {
    const log = receipt.logs[i];
    if (!(log.data === '0x' || log.topics.length < 2)) {
      const rcId: RcId = {
        hash: tx.hash,
        blockNumber: Number(tx.blockNumber),
        txIdx: Number(tx.transactionIndex),
        logIdx: i,
        eventSchema: log.topics[0],
      };
      pushArrayUpto(data.rc.events, rcId);
    }
    const logData = log.data;
    const logDataSize = getNumBytes(logData);
    if (logDataSize > maxLogDataSize) {
      maxLogDataSize = logDataSize;
    }
  }

  const txId: TxId = {
    hash: tx.hash,
    blockNumber: Number(tx.blockNumber),
    txIdx: Number(tx.transactionIndex),
  };
  if (numLogs < 20 && maxLogDataSize < 800) {
    pushArrayUpto(data.rc.category.default, txId);
  } else if (numLogs < 80 && maxLogDataSize < 1024) {
    pushArrayUpto(data.rc.category.medium, txId);
  } else if (numLogs < 80 && maxLogDataSize < 2048) {
    pushArrayUpto(data.rc.category.large, txId);
  } else if (numLogs < 400 && maxLogDataSize < 1024){
    pushArrayUpto(data.rc.category.max, txId);
  } else {
    pushArrayUpto(data.rc.category.oversize, txId);
  }
}

async function main() {
  const chainId = (await provider.getNetwork()).chainId.toString();
  data.chainId = chainId;
  let currentBlock = END_BLOCK;
  if (currentBlock === 0){ 
    currentBlock = await provider.getBlockNumber();
  }
  data.blockRange.end = currentBlock;

  let blocksToProcess: number[] = [...INCLUDE_BLOCKS];
  for (let i = 0; i < BLOCK_SAMPLES; i++) {
    blocksToProcess.push(currentBlock - i * BLOCK_INTERVAL);
  }
  for (let i = 0; i < blocksToProcess.length; i++) {
    console.log("Currently processing block:", blocksToProcess[i]);
    const blockNumber = blocksToProcess[i];
    if (blockNumber < data.blockRange.start) {
      data.blockRange.start = blockNumber;
    }
    
    const block = await getFullBlock(provider, blockNumber);
    // console.log(blockNumber, block)

    if (!block || block.transactions.length === 0) {
      continue;
    }
    for (let j = 0; j < block.transactions.length; j++) {
      const tx = block.transactions[j]; // Full transaction from FullBlock
      const contracts = await parseAccount(tx);
      await parseStorage(contracts, tx.blockNumber);
      await parseTx(tx);
      await parseReceipt(tx); 
    }

    console.log(JSON.stringify(data, null, 2));
    console.log("Remaining iterations:", blocksToProcess.length - i - 1);
  }

  // Write output file
  const outfile = `testdata chain${chainId} blocks${data.blockRange.start}-${data.blockRange.end}.json`;
  fs.writeFileSync(`./scripts/test/out/${outfile}`, JSON.stringify(data, null, 2));
}
main();

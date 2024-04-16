import fs from 'fs';
import path from 'path';
import dotenv from "dotenv";
import { ethers, JsonRpcProvider } from "ethers";
import { getFullBlock, getRawReceipt, getNumBytes, objectToRlp, bytes32 } from "@axiom-crypto/tools";
import { AddressId, RcId, StorageId, TxId } from "../types";
import { BLOCK_INTERVAL, BLOCK_SAMPLES, data, matchIgnoreAddrs } from "./defaults";
dotenv.config();

export const search = async (
  options: {
    provider: string;
    samples?: number;
    interval?: number;
    block?: number;
    include?: string;
    ignore?: string;
    output?: string;
  }
) => {
  const provider = new ethers.JsonRpcProvider(options.provider);
  let currentBlock = await provider.getBlockNumber();
  const numSamples = options.samples ?? BLOCK_SAMPLES;
  const interval = options.interval ?? BLOCK_INTERVAL;

  let includeBlocks: number[] = [];
  if (options.include !== undefined) {
    includeBlocks = options.include.split(",").map(Number);
  }
  let outputPath = './output';
  if (options.output !== undefined) {
    outputPath = options.output;
  }

  let ignoreAddrs: string[] = [...matchIgnoreAddrs];

  const chainId = (await provider.getNetwork()).chainId.toString();
  data.chainId = chainId;
  if (options.block !== undefined){ 
    currentBlock = options.block;
  }
  data.blockRange.start = currentBlock;
  data.blockRange.end = currentBlock;

  let blocksToProcess: number[] = [...includeBlocks];
  for (let i = 0; i < numSamples; i++) {
    blocksToProcess.push(currentBlock - i * interval);
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
    // Pick random transaction index from block of account to include
    const idx = Math.floor(Math.random() * block.transactions.length);

    // Include one per block
    let storageIncl = false;
    let eventIncl = false;
    const numEvents = data.rc.events.length;

    for (let j = 0; j < block.transactions.length; j++) {
      const tx = block.transactions[j]; // Full transaction from FullBlock
      
      const contracts = await parseAccount(provider, tx, idx, ignoreAddrs);
      if (!storageIncl) {
        storageIncl = await parseStorage(provider, contracts, tx.blockNumber);
      }
      await parseTx(tx);

      // Include one event per block
      if (data.rc.events.length > numEvents) {
        eventIncl = true;
      }
      await parseReceipt(provider, tx, eventIncl);
    }

    console.log(JSON.stringify(data, null, 2));
    console.log("Remaining iterations:", blocksToProcess.length - i - 1);
  }

  // Write output file
  const outfile = `${chainId} ${data.blockRange.start}-${data.blockRange.end}.json`;
  fs.mkdirSync(outputPath, { recursive: true });
  fs.writeFileSync(path.join(outputPath, outfile), JSON.stringify(data, null, 2));
}

/**
 * Pushes to an array up to a certain size (no-op if array is already at size)
 * @param arr Array to push to
 * @param itm Object to add to array
 * @param size Max size of the target array
 */
function pushArrayUpto<T>(arr: T[], itm: T, size: number = 32) {
  if (arr.length >= size) {
    return;
  }
  arr.push(itm);
}

/**
 * Parses the to and from fields of from the transaction object into EOAs or contracts
 * @param provider ethers JsonRpcProvider
 * @param tx Raw transaction object from the node
 * @param idx Index
 * @param ignoreAddrs Ignore any addresses that match these patterns
 * @returns Returns any addresses that are contracts
 */
async function parseAccount(provider: JsonRpcProvider, tx: any, idx: number, ignoreAddrs: string[]): Promise<string[]> {
  const accounts = [tx.from, tx.to];
  let contracts: string[] = [];
  for await (const account of accounts) {
    if (!account) {
      continue;
    }
    // Check if account matches any part of the addresses in ignoreAddrs
    const shouldIgnore = ignoreAddrs.some(ignoreAddr => account.includes(ignoreAddr));
    if (shouldIgnore) {
      continue; // Skip this account if it matches any ignore address pattern
    }
    const code = await provider.getCode(account);
    if (code === '0x') {
      if (Number(tx.transactionIndex) === idx) {
        pushArrayUpto(data.account.eoa, {
          blockNumber: Number(tx.blockNumber),
          address: account
        });
      }
    } else {
      if (Number(tx.transactionIndex) === idx) {
        pushArrayUpto(data.account.contract, {
          blockNumber: Number(tx.blockNumber),
          address: account
        });
      }
      contracts.push(account);
    }
  }
  return contracts;
}

/**
 * Parses the storage of a contract. We choose a random slot to check if it is non-zero because a lot of accounts will come in during the 
 * search and we want adequate distribution of storage values across the search range.
 * @param provider ethers JsonRpcProvider
 * @param contracts List of contracts to check storage for
 * @param blockNumber Blocknumber to check storage at
 * @returns True if we found a storage slot that is nonzero, false otherwise
 */
async function parseStorage(provider: JsonRpcProvider, contracts: string[], blockNumber: string): Promise<boolean> {
  if (contracts.length === 0) {
    return false;
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
      return true;
    }
  }
  return false;
}

/**
 * Parse a transaction and determine its type and size category
 * @param tx 
 */
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

  // TODO: Use QueryBuilder module to determine category
  if (numBytesTxData <= 8192 && aclNumBytesRlp <= 800) {
    pushArrayUpto(data.tx.category.default, txId);
  } else if (numBytesTxData <= 32768 && aclNumBytesRlp <= 1024) {
    pushArrayUpto(data.tx.category.large, txId);
  } else if (numBytesTxData <= 333000 && aclNumBytesRlp <= 131072) {
    pushArrayUpto(data.tx.category.max, txId);
  } else {
    pushArrayUpto(data.tx.category.oversize, txId);
  }
}

/**
 * Parse a receipt and determine its category and include an event
 * @param provider 
 * @param tx 
 * @param eventIncl Ignore if an event is already included in this block
 */
async function parseReceipt(provider: JsonRpcProvider, tx: any, eventIncl: boolean) {
  const receipt = await getRawReceipt(provider, tx.hash);
  const numLogs = receipt.logs.length;
  if (receipt.logs.length === 0) {
    return;
  }

  let maxLogDataSize = 0;
  for (let i = 0; i < numLogs; i++) {
    const log = receipt.logs[i];
    if (!eventIncl && !(log.data === '0x' || log.topics.length < 2)) {
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

  // TODO: Use QueryBuilder module to determine category
  if (numLogs <= 20 && maxLogDataSize <= 800) {
    pushArrayUpto(data.rc.category.default, txId);
  } else if (numLogs <= 80 && maxLogDataSize <= 1024) {
    pushArrayUpto(data.rc.category.medium, txId);
  } else if (numLogs <= 80 && maxLogDataSize <= 2048) {
    pushArrayUpto(data.rc.category.large, txId);
  } else if (numLogs <= 400 && maxLogDataSize <= 1024){
    pushArrayUpto(data.rc.category.max, txId);
  } else {
    pushArrayUpto(data.rc.category.oversize, txId);
  }
}


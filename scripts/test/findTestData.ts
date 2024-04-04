import { ethers } from "ethers";
import dotenv from "dotenv";
import { getFullBlock, getRawReceipt, getNumBytes, objectToRlp, bytes32 } from "@axiom-crypto/tools";
import fs from 'fs';
import { AddressId, RcId, TxId } from "./types";
dotenv.config();

const END_BLOCK = 0;
const BLOCK_SAMPLES = 128;
const BLOCK_INTERVAL = 64;

const provider = new ethers.JsonRpcProvider(process.env.PROVIDER_URI);

const IGNORE_ADDRS = [
  "0xdeaddeaddeaddeaddeaddeaddeaddeaddead0001",
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
    stats: {
      avgBalance: 0,
      avgCodeSize: 0,
      balances: [] as string[],
      codeSizes: [] as string[],
    },
  },
  storage: {
    nonzero: [] as AddressId[], // nonzero at slot 0
  },
  tx: {
    type: {
      "0": [] as TxId[],
      "1": [] as TxId[],
      "2": [] as TxId[],
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
  // totalTx: 0,
  // numTxType: {
  //   "0": 0,
  //   "1": 0,
  //   "2": 0,
  // } as any,
  // txDataAvgSize: 0,
  // txDataAvgSizeNonzero: 0,
  // numAccessListTotal: 0,
  // numAccessListTxType: {
  //   "1": 0,
  //   "2": 0,
  // } as any,
  // accessListAvgSize: {
  //   "1": 0,
  //   "2": 0,
  // } as any,

  // // Data for calculations
  // txDataSizes: [] as number[],  // size in bytes
  // accessListSizes: {
  //   "1": [] as number[],  // size in bytes
  //   "2": [] as number[],  // size in bytes
  // } as any,
  // logDataSizes: [] as number[],  // size in bytes
}

function pushMaxSize<T>(arr: T[], itm: T, size: number = 32) {
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
      pushMaxSize(data.account.eoa, {
        blockNumber: Number(tx.blockNumber),
        address: account
      });
    } else {
      pushMaxSize(data.account.contract, {
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
    const storage = await provider.getStorage(contract, 0, blockNumber);
    if (storage !== bytes32(0)) {
      pushMaxSize(data.storage.nonzero, {
        blockNumber: Number(blockNumber),
        address: contract,
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
  if (!(type === "0" || type === "1" || type === "2")) {
    return;
  }
  pushMaxSize(data.tx.type[type], txId);
  const numBytesTxData = getNumBytes(tx.input);
  if (tx.accessList !== undefined && tx.accessList !== null && tx.accessList.length !== 0) {
    const accessListRlp = objectToRlp(tx.accessList ?? {});
    const aclNumBytesRlp = getNumBytes(accessListRlp);

    if (numBytesTxData < 8192 && aclNumBytesRlp < 800) {
      pushMaxSize(data.tx.category.default, txId);
    } else if (numBytesTxData < 32768 && aclNumBytesRlp < 1024) {
      pushMaxSize(data.tx.category.large, txId);
    } else if (numBytesTxData < 333000 && aclNumBytesRlp < 131072) {
      pushMaxSize(data.tx.category.max, txId);
    } else {
      pushMaxSize(data.tx.category.oversize, txId);
    }
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
      pushMaxSize(data.rc.events, rcId);
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
    pushMaxSize(data.rc.category.default, txId);
  } else if (numLogs < 80 && maxLogDataSize < 1024) {
    pushMaxSize(data.rc.category.medium, txId);
  } else if (numLogs < 80 && maxLogDataSize < 2048) {
    pushMaxSize(data.rc.category.large, txId);
  } else if (numLogs < 400 && maxLogDataSize < 1024){
    pushMaxSize(data.rc.category.max, txId);
  } else {
    pushMaxSize(data.rc.category.oversize, txId);
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
  for (let i = 0; i < BLOCK_SAMPLES; i++) {
    console.log("Currently processing block:", currentBlock - i * BLOCK_INTERVAL);
    const blockNumber = currentBlock - i * BLOCK_INTERVAL;
    data.blockRange.start = blockNumber;
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
    console.log("Remaining iterations:", BLOCK_SAMPLES - i - 1);
  }

  // Calculate stats
  // data.txDataAvgSize = data.txDataSizes.reduce((a, b) => a + b, 0) / data.txDataSizes.length;
  // const nonzeroTxDataSizes = data.txDataSizes.filter((x) => x !== 0);
  // data.txDataAvgSizeNonzero = nonzeroTxDataSizes.reduce((a, b) => a + b, 0) / nonzeroTxDataSizes.length;
  // data.accessListAvgSize["1"] = data.accessListSizes["1"].reduce((a: number, b: number) => a + b, 0) / data.accessListSizes["1"].length;
  // data.accessListAvgSize["2"] = data.accessListSizes["2"].reduce((a: number, b: number) => a + b, 0) / data.accessListSizes["2"].length;

  const outfile = `testdata chain${chainId} blocks${data.blockRange.start}-${data.blockRange.end}.json`;
  // fs.mkdirSync('./scripts/test/out', { recursive: true });
  fs.writeFileSync(`./scripts/test/out/${outfile}`, JSON.stringify(data, null, 2));
}
main();

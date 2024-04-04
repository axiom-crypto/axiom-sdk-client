import { ethers } from "ethers";
import dotenv from "dotenv";
import { getFullBlock, getNumBytes, objectToRlp } from "@axiom-crypto/tools";
import fs from 'fs';
import { AddressId, TxId } from "./types";
dotenv.config();

const BLOCK_SAMPLES = 100;
const BLOCK_INTERVAL = 64;
const LOG_LARGE_ACL = true;
const LARGE_ACL_THRESH = 2000;

const provider = new ethers.JsonRpcProvider(process.env.PROVIDER_URI);



let stats = {
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
    nonzero: [] as AddressId[],
  },
  tx: {
    type: {
      "0": [] as TxId[],
      "1": [] as TxId[],
      "2": [] as TxId[],
    },
  },


  totalTx: 0,
  numTxType: {
    "0": 0,
    "1": 0,
    "2": 0,
  } as any,
  txDataAvgSize: 0,
  txDataAvgSizeNonzero: 0,
  numAccessListTotal: 0,
  numAccessListTxType: {
    "1": 0,
    "2": 0,
  } as any,
  accessListAvgSize: {
    "1": 0,
    "2": 0,
  } as any,

  // Data for calculations
  txDataSizes: [] as number[],  // size in bytes
  accessListSizes: {
    "1": [] as number[],  // size in bytes
    "2": [] as number[],  // size in bytes
  } as any,
  logDataSizes: [] as number[],  // size in bytes
}
let largeAclTxs = [] as any[];

async function main() {
  const network = await provider.getNetwork();
  stats.chainId = network.chainId.toString();
  const latestBlock = await provider.getBlockNumber();
  stats.blockRange.end = latestBlock;
  for (let i = 0; i < BLOCK_SAMPLES; i++) {
    console.log("Currently processing block:", latestBlock - i * BLOCK_INTERVAL);
    const blockNumber = latestBlock - i * BLOCK_INTERVAL;
    stats.blockRange.start = blockNumber;
    const block = await getFullBlock(provider, blockNumber);
    // const block = await provider.getBlock(blockNumber, true);
    console.log(blockNumber, block)
    // console.log(block!.transactions)
    if (!block || block.transactions.length === 0) {
      continue;
    }
    for (let j = 0; j < block.transactions.length; j++) {
      const tx = block.transactions[j];
      // console.log(`tx ${j}`, tx);
      const type = Number(tx.type).toString();
      stats.totalTx++;
      stats.numTxType[type]++;
      const numBytesTxData = getNumBytes(tx.input);
      stats.txDataSizes.push(numBytesTxData);
      if (tx.accessList !== undefined && tx.accessList !== null && tx.accessList.length !== 0) {
        stats.numAccessListTotal++;
        stats.numAccessListTxType[type]++;
        const accessListRlp = objectToRlp(tx.accessList ?? {});
        const aclNumBytesRlp = getNumBytes(accessListRlp);
        stats.accessListSizes[type].push(aclNumBytesRlp);
        if (LOG_LARGE_ACL && aclNumBytesRlp > LARGE_ACL_THRESH) {
          largeAclTxs.push(tx);
        }
      }
    }
  }
  stats.txDataAvgSize = stats.txDataSizes.reduce((a, b) => a + b, 0) / stats.txDataSizes.length;
  const nonzeroTxDataSizes = stats.txDataSizes.filter((x) => x !== 0);
  stats.txDataAvgSizeNonzero = nonzeroTxDataSizes.reduce((a, b) => a + b, 0) / nonzeroTxDataSizes.length;
  stats.accessListAvgSize["1"] = stats.accessListSizes["1"].reduce((a: number, b: number) => a + b, 0) / stats.accessListSizes["1"].length;
  stats.accessListAvgSize["2"] = stats.accessListSizes["2"].reduce((a: number, b: number) => a + b, 0) / stats.accessListSizes["2"].length;

  console.log(stats);

  const outfile = `tx-start${latestBlock}-samples${BLOCK_SAMPLES}-interval${BLOCK_INTERVAL}.json`;
  fs.writeFileSync(`./out/${outfile}`, JSON.stringify(stats, null, 2));
  if (LOG_LARGE_ACL) {
    fs.writeFileSync(`./out/${outfile}-large-acl.json`, JSON.stringify(largeAclTxs, null, 2));
  }
}
main();

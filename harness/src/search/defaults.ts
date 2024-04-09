import { AddressId, RcId, StorageId, TxId } from "../types";

// Number of blocks to sample
export const BLOCK_SAMPLES = 128;

// Interval between blocks to sample
export const BLOCK_INTERVAL = 64;

export let data = {
  chainId: "0",
  blockRange: {
    start: 0,
    end: 0,
  },
  blockSamples: 0,
  blockInterval: 0,
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
    events: [] as RcId[],
    category: {
      "default": [] as TxId[], // 800b, 20 logs
      "medium": [] as TxId[], // 1024b, 80 logs
      "large": [] as TxId[], // 2048b, 80 logs
      "max": [] as TxId[], // 1024b, 400 logs
      "oversize": [] as TxId[],
    },
  },
}

export const matchIgnoreAddrs = [
  "0xdeaddeaddeaddeaddeaddeaddeaddeaddead",
  "0000000000000000000000000000000",
]

export interface AddressId {
  blockNumber: number;
  address: string;
}

export interface StorageId {
  blockNumber: number;
  address: string;
  slot: number;
}

export interface TxId {
  hash: string;
  blockNumber: number;
  txIdx: number;
}

export interface RcId {
  hash: string;
  blockNumber: number;
  txIdx: number;
  logIdx: number;
  eventSchema: string;
}

export interface HarnessOptions {
  output: string;
  circuitInputsPath: string;
  fnName: string;
  send: boolean;
}
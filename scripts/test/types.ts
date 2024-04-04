export interface AddressId {
  blockNumber: number;
  address: string;
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
export interface AddressId {
  blockNumber: number;
  address: string;
}

export interface TxId {
  hash: string;
  blockNumber: number;
  index: number;
}

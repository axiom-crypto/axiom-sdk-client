import bs58 from 'bs58';

export abstract class IpfsClient {
  protected name: string;

  constructor(name: string) {
    this.name = name;
  }

  // Get the character length of the file
  // @param hashOrCid - IPFS hash in bytes32 or CIDv0
  // @returns - File size in character length
  abstract getSize(hashOrCid: string): Promise<number | null>;

  // Read a file from IPFS
  // @param hashOrCid - IPFS hash in bytes32 or CIDv0
  // @returns - File content as a string
  abstract read(hashOrCid: string): Promise<string | null>;

  // Write a file and pin it to IPFS
  // @param data - File content as a string
  // @returns - IPFS hash in bytes32
  abstract pin(data: string): Promise<string | null>;

  // Unpin a file from IPFS
  // @param hashOrCid - IPFS hash in bytes32 or CIDv0
  // @returns - Whether the unpinning was successful
  abstract unpin(hashOrCid: string): Promise<boolean>;

  // Convert bytes32 to CIDv0
  // @param bytes32Hex - IPFS hash in bytes32
  // @returns - IPFS hash in CIDv0
  convertIpfsCidToBytes32(ipfsCid: string) {
    return '0x' + Buffer.from(bs58.decode(ipfsCid).slice(2)).toString('hex')
  }
  
  // Convert CIDv0 to bytes32
  // @param bytes32Hex - IPFS hash in bytes32
  // @returns - IPFS hash in CIDv0
  convertBytes32ToIpfsCid(bytes32Hex: string) {
    return bs58.encode(Buffer.from('1220' + bytes32Hex.slice(2), 'hex'))
  }

  // Get the name of the IPFS client
  // @returns - IPFS client name
  getName() {
    return this.name;
  }
}
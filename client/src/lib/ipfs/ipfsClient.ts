import bs58 from 'bs58'

export abstract class IpfsClient {
  abstract read(hashOrCid: string): Promise<string | null>;
  abstract write(data: string): Promise<string | null>;

  convertIpfsCidToBytes32(ipfsCid: string) {
    return '0x' + Buffer.from(bs58.decode(ipfsCid).slice(2)).toString('hex')
  }
  
  convertBytes32ToIpfsCid(bytes32Hex: string) {
    return bs58.encode(Buffer.from('1220' + bytes32Hex.slice(2), 'hex'))
  }
}
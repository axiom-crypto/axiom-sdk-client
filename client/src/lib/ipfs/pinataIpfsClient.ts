import axios from 'axios';
import { IpfsClient } from "./ipfsClient";

export class PinataIpfsClient extends IpfsClient {
  private pinataJwt: string;

  constructor(pinataJwt: string | undefined) {
    super();
    if (!pinataJwt) {
      throw new Error("Pinata JWT is required");
    }
    this.pinataJwt = pinataJwt;
  }

  async read(hashOrCid: string): Promise<string | null> {
    try {
      if (hashOrCid.startsWith("0x")) {
        hashOrCid = this.convertBytes32ToIpfsCid(hashOrCid);
      }
      const res = await axios.get(`https://gateway.pinata.cloud/ipfs/${hashOrCid}`);
      return res.data.data ?? null;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async write(data: string): Promise<string | null> {
    const dataObj = {
      "pinataContent": {
        "data": data,
      },
      "pinataOptions": {
        "cidVersion": 0,
        "wrapWithDirectory": false,
      }
    }
    try {
      const res = await axios.post("https://api.pinata.cloud/pinning/pinJSONToIPFS", dataObj, {
        headers: {
          'Content-Type': "application/json",//`multipart/form-data; boundary= ${formData.getBoundary()}`,
          Authorization: `Bearer ${this.pinataJwt}`,
        }
      });
      const hash = res.data.IpfsHash
      return this.convertIpfsCidToBytes32(hash);
    } catch (e) {
      console.error(e);
      return null;
    }
  }
}
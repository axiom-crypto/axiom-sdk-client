import axios from 'axios';
import { IpfsClient } from "./ipfsClient";

export class PinataIpfsClient extends IpfsClient {
  private pinataJwt: string;
  private dedicatedGatewayUrl?: string;

  constructor(pinataJwt: string | undefined, dedicatedGatewayUrl?: string) {
    super("Pinata");
    if (!pinataJwt) {
      throw new Error("Pinata JWT is required");
    }
    this.pinataJwt = pinataJwt;
    if (dedicatedGatewayUrl) {
      if (dedicatedGatewayUrl[dedicatedGatewayUrl.length - 1] === "/") {
        dedicatedGatewayUrl = dedicatedGatewayUrl.slice(0, -1);
        if (!dedicatedGatewayUrl.endsWith("/ipfs")) {
          dedicatedGatewayUrl += "/ipfs";
        }
        this.dedicatedGatewayUrl = dedicatedGatewayUrl;
      }
    }
  }

  private getUrl(): string {
    if (this.dedicatedGatewayUrl) {
      return `${this.dedicatedGatewayUrl}`;
    }
    return `https://gateway.pinata.cloud/ipfs`;
  }

  async getSize(hashOrCid: string): Promise<number | null> {
    try {
      if (hashOrCid.startsWith("0x")) {
        hashOrCid = this.convertBytes32ToIpfsCid(hashOrCid);
      }
      // Pinata gateway will not return data size on a head request, so we need to use 
      // the public ipfs.io gateway instead.
      const res = await axios.head(`https://ipfs.io/ipfs/${hashOrCid}`);
      return res.headers["x-ipfs-datasize"] ?? null;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async read(hashOrCid: string): Promise<string | null> {
    try {
      if (hashOrCid.startsWith("0x")) {
        hashOrCid = this.convertBytes32ToIpfsCid(hashOrCid);
      }
      const url = this.getUrl();
      const res = await axios.get(`${url}/${hashOrCid}`, {
        headers: {
          Authorization: `Bearer ${this.pinataJwt}`,
        }
      });
      return res.data.data ?? null;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async pin(data: string): Promise<string | null> {
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
      const res = await axios.post(
        "https://api.pinata.cloud/pinning/pinJSONToIPFS",
        dataObj,
        {
          headers: {
            'Content-Type': "application/json",
            Authorization: `Bearer ${this.pinataJwt}`,
          }
        }
      );
      const hash = res.data.IpfsHash
      return this.convertIpfsCidToBytes32(hash);
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  async unpin(hashOrCid: string): Promise<boolean> {
    try {
      if (hashOrCid.startsWith("0x")) {
        hashOrCid = this.convertBytes32ToIpfsCid(hashOrCid);
      }
      const res = await axios.delete(`https://api.pinata.cloud/pinning/unpin/${hashOrCid}`, {
        headers: {
          Authorization: `Bearer ${this.pinataJwt}`,
        }
      });
      return res.status === 200;
    } catch (e: any) {
      console.error(e);
      return false;
    }
  }
}
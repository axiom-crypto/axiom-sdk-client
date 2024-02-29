import axios from 'axios';
import FormData from 'form-data';
import { IpfsClient } from "./ipfsClient";

export class QuicknodeIpfsClient extends IpfsClient {
  private gatewayUrl: string;
  private apiKey: string;

  constructor(gatewayUrl: string, apiKey: string) {
    super("Quicknode");
    if (gatewayUrl[gatewayUrl.length - 1] === "/") {
      gatewayUrl = gatewayUrl.slice(0, -1);
    }
    this.gatewayUrl = gatewayUrl;
    this.apiKey = apiKey;
  }

  async getSize(hashOrCid: string): Promise<number | null> {
    try {
      if (hashOrCid.startsWith("0x")) {
        hashOrCid = this.convertBytes32ToIpfsCid(hashOrCid);
      }
      const res = await axios.head(`${this.gatewayUrl}/${hashOrCid}`);
      return res.headers["content-length"] ?? null;
    } catch (e: any) {
      console.error(e?.message);
      return null;
    }
  }

  async read(hashOrCid: string): Promise<string | null> {
    try {
      if (hashOrCid.startsWith("0x")) {
        hashOrCid = this.convertBytes32ToIpfsCid(hashOrCid);
      }
      const res = await axios.get(`${this.gatewayUrl}/${hashOrCid}`, {
        headers: {
          "x-api-key": this.apiKey,
        },
      });
      return res.data ?? null;
    } catch (e: any) {
      console.error(e?.message);
      return null;
    }
  }

  async pin(data: string): Promise<string | null> {
    const path = Date.now().toString();
    const formdata = new FormData();
    formdata.append("Body", data, path);
    formdata.append("Key", path);
    formdata.append("ContentType", "text/plain");
    
    try {
      const res = await axios.post(
        `https://api.quicknode.com/ipfs/rest/v1/s3/put-object`,
        formdata,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            "x-api-key": this.apiKey,
          },
        }
      );
      const cid = res.data.pin.cid;
      return this.convertIpfsCidToBytes32(cid);
    } catch (e: any) {
      console.error(e);
      return null;
    }
  }

  async unpin(hashOrCid: string): Promise<boolean> {
    try {
      if (hashOrCid.startsWith("0x")) {
        hashOrCid = this.convertBytes32ToIpfsCid(hashOrCid);
      }

      // Get all user's pinned objects
      let pinnedCidRequestIds: {[cid: string]: string} = {};
      let pageNumber = 1;
      while (true) {
        const res = await axios.get(`https://api.quicknode.com/ipfs/rest/v1/pinning?` + new URLSearchParams({
          pageNumber: pageNumber.toString(),
          perPage: "100",
        }), {
          headers: {
            "x-api-key": this.apiKey,
          },
        });
        res.data.data.forEach((pinnedObject: any) => {
          pinnedCidRequestIds[pinnedObject.cid] = pinnedObject.requestId;
        });
        if (pageNumber === res.data.totalPages || pageNumber > 1000) {
          break;
        }
        pageNumber++;
      }

      const requestId = pinnedCidRequestIds[hashOrCid];
      const res = await axios.delete(`https://api.quicknode.com/ipfs/rest/v1/pinning/${requestId}`, {
        headers: {
          "x-api-key": this.apiKey,
        },
      });
      return res.status === 200;
    } catch (e: any) {
      console.error(e);
      return false;
    }
  }
}
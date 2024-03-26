import { PublicClient } from "viem";
import { AxiomV2BroadcastClientConfig, AxiomV2BroadcastClientParams, BroadcastParams, Channel } from "./types";
import { broadcasterWrite, viemPublicClient, viemWalletClient } from "./utils";
import { getAxiomV2BroadcasterAddress } from "./lib/address";
import { getAxiomV2BroadcasterAbi } from "./lib";

export class Broadcaster {
  protected source: AxiomV2BroadcastClientParams;
  protected publicClients: {[chainId: string]: PublicClient} = {};

  constructor(
    sourceConfig: AxiomV2BroadcastClientConfig,
  ) {
    const publicClient = viemPublicClient(sourceConfig.chainId, sourceConfig.provider);
    let walletClient = undefined;
    if (sourceConfig.privateKey) {
      walletClient = viemWalletClient(sourceConfig.chainId, sourceConfig.provider, sourceConfig.privateKey);
    }
    this.source = {
      chainId: sourceConfig.chainId,
      publicClient,
      walletClient,
    } as AxiomV2BroadcastClientParams;
  }

  protected requireWalletClient(clientParams: AxiomV2BroadcastClientParams) {
    if (!clientParams.walletClient) {
      throw new Error(`Wallet client for ${clientParams.chainId} is required for this operation`);
    }
  }

  public async getChannel(channel: Channel): Promise<string> {
    const broadcasterAddress = getAxiomV2BroadcasterAddress(this.source.chainId);
    const broadcasterAbi = getAxiomV2BroadcasterAbi();
    const broadcastModuleAddr = await this.source.publicClient.readContract({
      address: broadcasterAddress,
      abi: broadcasterAbi,
      functionName: "channelToBroadcastModule",
      args: [channel.chainId, channel.bridgeId],
    });
    console.log(broadcastModuleAddr);
    return broadcastModuleAddr;
  }

  // public async getRemotePmmrSnapshots(channel: Channel): Promise<string[]> {
  //   if (this.publicClients[channel.chainId] === undefined) {
  //     const providerUri = process.env[`PROVIDER_URI_${channel.chainId}`];
  //     if (!providerUri) {
  //       throw new Error(`Environment variable PROVIDER_URI_${channel.chainId} is not defined`);
  //     }
  //     this.publicClients[channel.chainId] = createPublicClient({
  //       chain: createChain(channel.chainId, providerUri),
  //       transport: http(providerUri),
  //     });
  //   }
  //   // Get contract address 
  // }

  public async addChannel(channel: Channel, broadcastModuleAddr: string) {
    this.requireWalletClient(this.source);
    const receipt = await broadcasterWrite(
      this.source,
      {
        functionName: "addChannel",
        args: [channel, broadcastModuleAddr],
      }
    );
    console.log(receipt);
  }

  public async removeChannel(channel: Channel) {
    this.requireWalletClient(this.source);
    const receipt = await broadcasterWrite(
      this.source,
      {
        functionName: "removeChannel",
        args: [channel],
      }
    );
    console.log(receipt);
  }

  public async sendBlockhashPmmr(
    pmmrSize: number,
    channels: Channel[],
    broadcastParamsList: BroadcastParams[],
  ) {
    this.requireWalletClient(this.source);
    if (channels.length !== broadcastParamsList.length) {
      throw new Error("`channels` and `broadcastParamsList` must be the same length");
    }
    
    const receipt = await broadcasterWrite(
      this.source,
      {
        functionName: "sendBlockhashPmmr",
        args: [pmmrSize, channels, broadcastParamsList],
      }
    );
    console.log(receipt);
  }

//   function sendLatestBlockhashPmmr(
//     uint32 pmmrSize,
//     bytes32[] calldata mmrPeaks,
//     Channel[] calldata channels,
//     BroadcastParams[] calldata broadcastParamsList
  public async sendLatestBlockhashPmmr(
    pmmrSize: number,
    mmrPeaks: string[],
    channels: Channel[],
    broadcastParamsList: BroadcastParams[],
  ) {
    this.requireWalletClient(this.source);
    if (channels.length !== broadcastParamsList.length) {
      throw new Error("`channels` and `broadcastParamsList` must be the same length");
    }
    const receipt = await broadcasterWrite(
      this.source,
      {
        functionName: "sendLatestBlockhashPmmr",
        args: [pmmrSize, mmrPeaks, channels, broadcastParamsList],
      }
    );
    console.log(receipt);
  }

  // public async getBroadcastParams(channel: Channel): Promise<BroadcastParams> {
    
  // }
}
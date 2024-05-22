import {
  AxiomV2Callback,
  AxiomV2QueryOptions,
  AxiomV2SendQueryArgs,
  AxiomV2ClientCrosschainConfig,
  BridgeType,
  ChainConfig,
  ClientConfig,
} from "../types";
import { validateChainId } from "./utils";
import { 
  TransactionReceipt,
  WalletClient,
  createPublicClient,
  createWalletClient,
  http,
} from "viem";
import { privateKeyToAccount } from 'viem/accounts'
import { getAxiomV2QueryBlockhashOracleAddress, getAxiomV2QueryBroadcasterAddress, viemChain } from "../lib";
import { getChainDefaults } from "../lib/chain";
import { AxiomBaseCircuitGeneric, AxiomCore } from "./axiomCore";
import { buildSendQuery } from "../sendQuery";

export class AxiomCrosschainBase<T, C extends AxiomBaseCircuitGeneric<T>> extends AxiomCore<T, C> {
  protected source: ChainConfig;
  protected target: ClientConfig;
  protected bridgeType: BridgeType;
  protected bridgeId?: number;
  protected caller: string;

  constructor(
    config: AxiomV2ClientCrosschainConfig<T>,
    axiomBaseCircuit: AxiomBaseCircuitGeneric<T>,
    numThreads: number,
  ) {
    const publicClient = createPublicClient({
      chain: viemChain(config.target.chainId, config.target.rpcUrl),
      transport: http(config.target.rpcUrl),
    });

    let walletClient: WalletClient | undefined;
    if (config.target.privateKey) {
      const account = privateKeyToAccount(config.target.privateKey as `0x${string}`);
      walletClient = createWalletClient({
        chain: viemChain(config.target.chainId, config.target.rpcUrl),
        account,
        transport: http(config.target.rpcUrl),
      });
      if (walletClient.account === undefined) {
        throw new Error("Failed to create wallet client");
      }
    }

    const caller = walletClient?.account?.address ?? config.target.caller;
    if (!caller) {
      throw new Error("`privateKey` or `caller` must be provided");
    }

    let fallbackQueryAddress;
    if (config.bridgeType === BridgeType.Broadcaster) {
      if (config.bridgeId === undefined) {
        throw new Error("`bridgeId` is required for Broadcaster bridge type");
      }
      fallbackQueryAddress = getAxiomV2QueryBroadcasterAddress({
        targetChainId: config.target.chainId,
        sourceChainId: config.source.chainId,
        bridgeId: config.bridgeId!,
      });
    } else if (config.bridgeType === BridgeType.BlockhashOracle) {
      fallbackQueryAddress = getAxiomV2QueryBlockhashOracleAddress({
        targetChainId: config.target.chainId,
        sourceChainId: config.source.chainId,
      });
    } else {
      throw new Error("Invalid bridge type");
    }
    const axiomV2QueryAddress = config.options?.overrides?.queryAddress ?? fallbackQueryAddress;

    super(config, axiomV2QueryAddress, axiomBaseCircuit as C, numThreads, publicClient, walletClient);

    this.source = config.source;
    this.target = config.target;
    this.bridgeType = config.bridgeType;
    this.bridgeId = config.bridgeId;
    this.caller = caller;

    this.options = config.options;
    if (config.options?.overrides?.queryAddress === undefined) {
      validateChainId(this.target.chainId);
    }
  }

  async sendQuery(): Promise<TransactionReceipt> {
    if (!this.sendQueryWalletClient) {
      throw new Error("Setting `privateKey` in the `AxiomCrosschain` constructor's `target` struct is required to send a query");
    }
    return super.sendQuery();
  }

  protected async buildSendQueryArgs(): Promise<AxiomV2SendQueryArgs> {
    const computeQuery = this.axiomBaseCircuit.getComputeQuery();
    if (!computeQuery) throw new Error("No compute query generated");
    if (!this.source.chainId) throw new Error("No source chain ID provided");
    if (!this.target.chainId) throw new Error("No target chain ID provided");

    const callback: AxiomV2Callback = {
      target: this.callback.target,
      extraData: this.callback.extraData ?? "0x",
    };
    const options: AxiomV2QueryOptions = {
      ...this.options,
      callbackGasLimit: this.options?.callbackGasLimit ?? Number(getChainDefaults(this.target.chainId).callbackGasLimit),
      refundee: this.options?.refundee,
      overrides: this.options?.overrides,
    };

    const sendQueryArgs = await buildSendQuery({
      chainId: this.source.chainId,
      rpcUrl: this.source.rpcUrl,
      axiomV2QueryAddress: this.axiomV2QueryAddress,
      dataQuery: this.axiomBaseCircuit.getDataQuery(),
      computeQuery,
      callback,
      caller: this.caller,
      mock: false,
      options,
      target: {
        chainId: this.target.chainId,
        rpcUrl: this.target.rpcUrl,
      }
    })

    this.sendQueryArgs = sendQueryArgs;
    return sendQueryArgs;
  }
}

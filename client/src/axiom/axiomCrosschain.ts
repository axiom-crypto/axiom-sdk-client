import {
  AxiomV2Callback,
  AxiomV2QueryOptions,
  AxiomV2SendQueryArgs,
  AxiomV2CrosschainConfig,
  SourceChainConfig,
  TargetChainConfig,
  BridgeType,
} from "../types";
import {
  DEFAULT_CAPACITY,
} from "@axiom-crypto/circuit";
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
import { AxiomCore } from "./axiomCore";
import { AxiomBaseCircuit } from "@axiom-crypto/circuit/js";
import { buildSendQuery } from "../sendQuery";
import { CoreConfig } from "../types/internal";

export class AxiomCrosschain<T> extends AxiomCore<T> {
  source: SourceChainConfig;
  target: TargetChainConfig;

  constructor(config: AxiomV2CrosschainConfig<T>) {
    const capacity = config.capacity ?? config.compiledCircuit.capacity ?? DEFAULT_CAPACITY;
    const axiomBaseCircuit = new AxiomBaseCircuit({
      f: config.circuit,
      rpcUrl: config.source.rpcUrl,
      inputSchema: config.compiledCircuit.inputSchema,
      chainId: config.source.chainId,
      capacity,
    });
    
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

    const fallbackQueryAddress = config.source.bridgeType === BridgeType.BlockhashOracle ? 
      getAxiomV2QueryBlockhashOracleAddress(config.source.chainId, config.target.chainId) :
      getAxiomV2QueryBroadcasterAddress(config.source.chainId, config.target.chainId, config.source.bridgeId!);
    const axiomV2QueryAddress = config.options?.overrides?.queryAddress ?? fallbackQueryAddress;

    if (config.source.bridgeType === BridgeType.Broadcaster && config.source.bridgeId === undefined) {
      throw new Error("`source.bridgeId` is required for Broadcaster bridge type");
    }

    const coreConfig: CoreConfig<T> = {
      circuit: config.circuit,
      compiledCircuit: config.compiledCircuit,
      callback: config.callback,
      options: config.options,
      capacity,
    }
    super(coreConfig, axiomV2QueryAddress, axiomBaseCircuit, publicClient, walletClient);

    this.source = config.source;
    this.target = config.target;

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
    if (!this.sendQueryWalletClient) {
      throw new Error("Setting `privateKey` in the `Axiom` constructor is required to get sendQuery args");
    }
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
      caller: this.sendQueryWalletClient?.account?.address,
      mock: false,
      options,
    })

    this.sendQueryArgs = sendQueryArgs;
    return sendQueryArgs;
  }
}

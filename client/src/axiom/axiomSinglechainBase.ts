import {
  AxiomV2Callback,
  AxiomV2ClientConfig,
  AxiomV2QueryOptions,
  AxiomV2SendQueryArgs,
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
import { getAxiomV2QueryAddress, viemChain } from "../lib";
import { getChainDefaults } from "../lib/chain";
import { AxiomBaseCircuitGeneric, AxiomCore } from "./axiomCore";
import { buildSendQuery } from "../sendQuery";

export class AxiomSinglechainBase<T, C extends AxiomBaseCircuitGeneric<T>> extends AxiomCore<T, C> {
  protected config: AxiomV2ClientConfig<T>;
  
  constructor(config: AxiomV2ClientConfig<T>, axiomBaseCircuit: AxiomBaseCircuitGeneric<T>) {
    const publicClient = createPublicClient({
      chain: viemChain(config.chainId, config.rpcUrl),
      transport: http(config.rpcUrl),
    });

    let walletClient: WalletClient | undefined;
    if (config.privateKey) {
      const account = privateKeyToAccount(config.privateKey as `0x${string}`);
      walletClient = createWalletClient({
        chain: viemChain(config.chainId, config.rpcUrl),
        account,
        transport: http(config.rpcUrl),
      });
      if (walletClient.account === undefined) {
        throw new Error("Failed to create wallet client");
      }
    }

    const axiomV2QueryAddress = config.options?.overrides?.queryAddress ?? getAxiomV2QueryAddress(config.chainId);

    super(config, axiomV2QueryAddress, axiomBaseCircuit as C, publicClient, walletClient);

    this.config = config;
    this.compiledCircuit = config.compiledCircuit;

    this.options = config.options;
    if (config.options?.overrides?.queryAddress === undefined) {
      validateChainId(this.config.chainId);
    }
  }

  async sendQuery(): Promise<TransactionReceipt> {
    if (!this.sendQueryWalletClient) {
      throw new Error("Setting `privateKey` in the `Axiom` constructor is required to send a query");
    }
    return super.sendQuery();
  }

  protected async buildSendQueryArgs(): Promise<AxiomV2SendQueryArgs> {
    if (!this.sendQueryWalletClient) {
      throw new Error("Setting `privateKey` in the `Axiom` constructor is required to get sendQuery args");
    }
    const computeQuery = this.axiomBaseCircuit.getComputeQuery();
    if (!computeQuery) throw new Error("No compute query generated");
    if (!this.config.chainId) throw new Error("No chain ID provided");

    const callback: AxiomV2Callback = {
      target: this.callback.target,
      extraData: this.callback.extraData ?? "0x",
    };
    const options: AxiomV2QueryOptions = {
      ...this.options,
      callbackGasLimit: this.options?.callbackGasLimit ?? Number(getChainDefaults(this.config.chainId).callbackGasLimit),
      refundee: this.options?.refundee,
      overrides: this.options?.overrides,
    };

    const sendQueryArgs = await buildSendQuery({
      chainId: this.config.chainId,
      rpcUrl: this.config.rpcUrl,
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
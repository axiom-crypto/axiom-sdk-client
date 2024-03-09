import { AxiomCircuit } from "../js";
import {
  AxiomV2ClientConfig,
  AxiomV2ClientOptions,
  AxiomV2CompiledCircuit,
  AxiomV2SendQueryArgs,
} from "../types";
import { AxiomV2CircuitCapacity, RawInput } from "@axiom-crypto/circuit/types";
import { DEFAULT_CAPACITY } from "@axiom-crypto/circuit/constants";
import { convertChainIdToViemChain, validateChainId } from "./utils";
import { PublicClient, TransactionReceipt, WalletClient, createPublicClient, createWalletClient, http, zeroAddress, zeroHash } from "viem";
import { privateKeyToAccount } from 'viem/accounts'
import { AxiomV2Callback } from "@axiom-crypto/core";
import { ClientConstants } from "../constants";
import { viemChain } from "../lib";

export class Axiom<T> {
  protected config: AxiomV2ClientConfig<T>;
  protected axiomCircuit: AxiomCircuit<T>;
  protected compiledCircuit: AxiomV2CompiledCircuit;
  protected callback: AxiomV2Callback;
  protected options?: AxiomV2ClientOptions;
  protected capacity?: AxiomV2CircuitCapacity;
  protected publicClient: PublicClient;
  protected walletClient?: WalletClient;
  protected sendQueryArgs?: AxiomV2SendQueryArgs;

  constructor(config: AxiomV2ClientConfig<T>) {
    this.config = config;
    this.compiledCircuit = config.compiledCircuit;
    this.callback = {
      target: config.callback.target,
      extraData: config.callback.extraData ?? "0x",
    };

    this.options = config.options;
    if (config.options?.overrides?.chainId === undefined) {
      validateChainId(this.config.chainId);
    }

    this.axiomCircuit = new AxiomCircuit({
      f: config.circuit,
      provider: this.config.provider,
      inputSchema: config.compiledCircuit.inputSchema,
      chainId: this.config.chainId,
      capacity: this.capacity,
    });

    const publicClient = createPublicClient({
      chain: viemChain(config.chainId, config.provider),
      transport: http(config.provider),
    });
    this.publicClient = publicClient;

    if (this.config.privateKey) {
      const account = privateKeyToAccount(this.config.privateKey as `0x${string}`);
      this.walletClient = createWalletClient({
        chain: viemChain(config.chainId, config.provider),
        account,
        transport: http(this.config.provider),
      });
      if (this.walletClient.account === undefined) {
        throw new Error("Failed to create wallet client");
      }
    }
  }

  async init() {
    await this.axiomCircuit.loadSaved({
      config: {
        config: this.compiledCircuit.config,
        capacity: this.capacity ?? DEFAULT_CAPACITY,
      },
      vk: this.compiledCircuit.vk,
    });
  }

  getSendQueryArgs(): AxiomV2SendQueryArgs | undefined {
    return this.sendQueryArgs;
  }

  setOptions(options: AxiomV2ClientOptions) {
    this.options = {
      ...this.options,
      ...options,
    };
  }

  setCallback(callback: {
    target?: string;
    extraData?: string;
  }) {
    this.callback = {
      ...this.callback,
      ...callback,
    }
  }

  async prove(input: RawInput<T>): Promise<AxiomV2SendQueryArgs> {
    await this.axiomCircuit.run(input);
    return await this.buildSendQueryArgs(); 
  }

  async sendQuery(): Promise<TransactionReceipt> {
    const args = this.getSendQueryArgs();
    if (args === undefined) {
      throw new Error("SendQuery args have not been built yet. Please run `prove` first.");
    }
    try {
      const { request } = await this.publicClient.simulateContract({
        address: args.address as `0x${string}`,
        abi: args.abi,
        functionName: args.functionName,
        args: args.args,
        account: this.walletClient?.account!, // checked on initialization
        value: args.value,
      });
      const hash = await this.walletClient?.writeContract(request);
      if (hash === undefined) {
        throw new Error("Failed to send the query transaction to AxiomV2Query");
      }
      return await this.publicClient.waitForTransactionReceipt({ hash });
    } catch (e: any) {
      if (e?.metaMessages !== undefined) {
        throw new Error(e.metaMessages.join("\n"));
      }
      throw new Error(e);
    }
  }

  async sendQueryWithIpfs(): Promise<TransactionReceipt> {
    if (this.config.ipfsClient === undefined) {
      throw new Error("Setting `ipfsClient` is required to send a Query with IPFS");
    }

    const args = await this.getSendQueryArgs();
    if (args === undefined) {
      throw new Error("SendQuery args have not been built yet. Please run `prove` first.");
    }
    try { 
      const { request } = await this.publicClient.simulateContract({
        address: args.address as `0x${string}`,
        abi: args.abi,
        functionName: args.functionName,
        args: args.args,
        account: this.walletClient?.account!, // checked on initialization
        value: args.value,
      });
      const hash = await this.walletClient?.writeContract(request);
      if (hash === undefined) {
        throw new Error("Failed to send the query transaction to AxiomV2Query");
      }
      return await this.publicClient.waitForTransactionReceipt({ hash });
    } catch (e: any) {
      if (e?.metaMessages !== undefined) {
        throw new Error(e.metaMessages.join("\n"));
      }
      throw new Error(e);
    }
  }

  protected async buildSendQueryArgs(): Promise<AxiomV2SendQueryArgs> {
    if (this.walletClient === undefined) {
      throw new Error("Setting `privateKey` in the `Axiom` constructor is required to get sendQuery args");
    }
    const clientOptions: AxiomV2ClientOptions = {
      ...this.options,
      callbackGasLimit: this.options?.callbackGasLimit ?? ClientConstants.CALLBACK_GAS_LIMIT,
      refundee: this.options?.refundee ?? this.walletClient?.account?.address,
      ipfsClient: this.config.ipfsClient,
      overrides: this.options?.overrides,
    };
    
    this.sendQueryArgs = await this.axiomCircuit.getSendQueryArgs({
      callbackTarget: this.callback.target,
      callbackExtraData: this.callback.extraData ?? "0x",
      callerAddress: this.walletClient?.account?.address,
      options: clientOptions,
    });

    return this.sendQueryArgs;
  }
}
import { AxiomCircuit } from "../js";
import { 
  AxiomV2ClientConfig,
  AxiomV2ClientOptions,
  AxiomV2CompiledCircuit,
} from "./types";
import { RawInput } from "@axiom-crypto/circuit/types";
import { convertChainIdToViemChain } from "./utils";
import { TransactionReceipt, WalletClient, createPublicClient, createWalletClient, http, zeroAddress, zeroHash } from "viem";
import { privateKeyToAccount } from 'viem/accounts'
import { AxiomV2Callback, AxiomV2ComputeQuery } from "@axiom-crypto/core";
import { ClientConstants } from "../constants";

export class Axiom<T> {
  protected config: AxiomV2ClientConfig<T>;
  protected axiomCircuit: AxiomCircuit<T>;
  protected compiledCircuit: AxiomV2CompiledCircuit;
  protected callback: AxiomV2Callback;
  protected options?: AxiomV2ClientOptions;
  protected walletClient?: WalletClient;

  constructor(config: AxiomV2ClientConfig<T>) {
    this.config = config;
    this.compiledCircuit = config.compiledCircuit;
    this.callback = {
      target: config.callback.target,
      extraData: config.callback.extraData ?? "0x",
    };

    this.axiomCircuit = new AxiomCircuit({
      f: config.circuit,
      provider: this.config.provider,
      inputSchema: config.compiledCircuit.inputSchema,
      chainId: this.config.chainId,
    });

    if (this.config.privateKey) {
      const account = privateKeyToAccount(this.config.privateKey as `0x${string}`);
      this.walletClient = createWalletClient({
        chain: convertChainIdToViemChain(this.config.chainId),
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
      config: this.compiledCircuit.config,
      vk: this.compiledCircuit.vk,
    });
  }

  async getSendQueryArgs() {
    if (this.walletClient === undefined) {
      throw new Error("Setting `privateKey` in the `Axiom` constructor is required to get sendQuery args");
    }
    const clientOptions = {
      ...this.options,
      callbackGasLimit: this.options?.callbackGasLimit ?? ClientConstants.CALLBACK_GAS_LIMIT,
      refundee: this.options?.refundee ?? this.walletClient?.account?.address,
      ipfsClient: this.config.ipfsClient,
    };
    return await this.axiomCircuit.getSendQueryArgs({
      callbackTarget: this.callback.target,
      callbackExtraData: this.callback.extraData ?? "0x",
      callerAddress: this.walletClient?.account?.address,
      options: clientOptions,
    });
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

  async prove(input: RawInput<T>): Promise<AxiomV2ComputeQuery> {
    return await this.axiomCircuit.run(input);
  }

  async sendQuery(): Promise<TransactionReceipt> {
    const publicClient = createPublicClient({
      chain: convertChainIdToViemChain(this.config.chainId),
      transport: http(this.config.provider),
    });
    const args = await this.getSendQueryArgs(); 
    try {
      const { request } = await publicClient.simulateContract({
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
      return await publicClient.waitForTransactionReceipt({ hash });
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
    const publicClient = createPublicClient({
      chain: convertChainIdToViemChain(this.config.chainId),
      transport: http(this.config.provider),
    });
    const args = await this.getSendQueryArgs(); 
    try { 
      const { request } = await publicClient.simulateContract({
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
      return await publicClient.waitForTransactionReceipt({ hash });
    } catch (e: any) {
      if (e?.metaMessages !== undefined) {
        throw new Error(e.metaMessages.join("\n"));
      }
      throw new Error(e);
    }
  }
}
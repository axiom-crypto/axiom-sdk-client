import {
  AxiomV2Callback,
  AxiomV2QueryOptions,
  AxiomV2CompiledCircuit,
  AxiomV2SendQueryArgs,
} from "../types";
import {
  AxiomV2CircuitCapacity,
  UserInput,
  DEFAULT_CAPACITY,
  DataSubquery,
  CircuitConfig,
  AxiomV2ComputeQuery,
} from "@axiom-crypto/circuit";
import { 
  PublicClient,
  TransactionReceipt,
  WalletClient,
} from "viem";
import { CoreConfig } from "../types/internal";

// Generic stand-in type for AxiomBaseCircuit<T> to handle both JS and Web versions
export type AxiomBaseCircuitGeneric<T> = {
  loadSaved: (args: {
    config: CircuitConfig;
    capacity: AxiomV2CircuitCapacity;
    vk: any;
  }) => Promise<void>;
  getDataQuery: () => DataSubquery[];
  getComputeQuery: () => AxiomV2ComputeQuery | undefined;
  run: (input: UserInput<T>) => Promise<AxiomV2ComputeQuery>;
}

export abstract class AxiomCore<T, C extends AxiomBaseCircuitGeneric<T>> {
  protected coreConfig: CoreConfig<T>;
  protected axiomV2QueryAddress: string;
  protected axiomBaseCircuit: C;
  protected compiledCircuit: AxiomV2CompiledCircuit;
  protected capacity: AxiomV2CircuitCapacity;
  protected callback: AxiomV2Callback;
  protected sendQueryPublicClient: PublicClient;
  protected sendQueryWalletClient?: WalletClient;
  protected options?: AxiomV2QueryOptions;
  protected sendQueryArgs?: AxiomV2SendQueryArgs;

  constructor(
    config: CoreConfig<T>,
    axiomV2QueryAddress: string,
    axiomBaseCircuit: C,
    sendQueryPublicClient: PublicClient,
    sendQueryWalletClient?: WalletClient,
  ) {
    this.coreConfig = config;
    this.axiomV2QueryAddress = axiomV2QueryAddress;
    this.axiomBaseCircuit = axiomBaseCircuit;
    this.compiledCircuit = config.compiledCircuit;
    this.capacity = config.capacity ?? config.compiledCircuit.capacity ?? DEFAULT_CAPACITY;
    this.callback = {
      target: config.callback.target,
      extraData: config.callback.extraData ?? "0x",
    };
    this.sendQueryPublicClient = sendQueryPublicClient;
    this.sendQueryWalletClient = sendQueryWalletClient;
    this.options = config.options;
  }

  async init() {
    await this.axiomBaseCircuit.loadSaved({
      config: this.compiledCircuit.config,
      capacity: this.capacity,
      vk: this.compiledCircuit.vk,
    });
  }

  getOptions(): AxiomV2QueryOptions | undefined {
    return this.options;
  }

  getDataQuery(): DataSubquery[] {
    return this.axiomBaseCircuit.getDataQuery();
  }

  getSendQueryArgs(): AxiomV2SendQueryArgs | undefined {
    return this.sendQueryArgs;
  }

  setOptions(options: AxiomV2QueryOptions) {
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

  async prove(input: UserInput<T>): Promise<AxiomV2SendQueryArgs> {
    await this.axiomBaseCircuit.run(input);
    return await this.buildSendQueryArgs(); 
  }

  async sendQuery(): Promise<TransactionReceipt> {
    const args = this.getSendQueryArgs();
    if (args === undefined) {
      throw new Error("SendQuery args have not been built yet. Please run `prove` first.");
    }
    try {
      const { request } = await this.sendQueryPublicClient.simulateContract({
        address: args.address as `0x${string}`,
        abi: args.abi,
        functionName: args.functionName,
        args: args.args,
        account: this.sendQueryWalletClient?.account!, // checked on initialization
        value: args.value,
      });
      const hash = await this.sendQueryWalletClient?.writeContract(request);
      if (hash === undefined) {
        throw new Error("Failed to send the query transaction to AxiomV2Query");
      }
      return await this.sendQueryPublicClient.waitForTransactionReceipt({ hash });
    } catch (e: any) {
      if (e?.metaMessages !== undefined) {
        throw new Error(e.metaMessages.join("\n"));
      }
      throw new Error(e);
    }
  }

  async sendQueryWithIpfs(): Promise<TransactionReceipt> {
    if (this.coreConfig.options?.ipfsClient === undefined) {
      throw new Error("Setting `ipfsClient` is required to send a Query with IPFS");
    }

    const args = await this.getSendQueryArgs();
    if (args === undefined) {
      throw new Error("SendQuery args have not been built yet. Please run `prove` first.");
    }
    try { 
      const { request } = await this.sendQueryPublicClient.simulateContract({
        address: args.address as `0x${string}`,
        abi: args.abi,
        functionName: args.functionName,
        args: args.args,
        account: this.sendQueryWalletClient?.account!, // checked on initialization
        value: args.value,
      });
      const hash = await this.sendQueryWalletClient?.writeContract(request);
      if (hash === undefined) {
        throw new Error("Failed to send the query transaction to AxiomV2Query");
      }
      return await this.sendQueryPublicClient.waitForTransactionReceipt({ hash });
    } catch (e: any) {
      if (e?.metaMessages !== undefined) {
        throw new Error(e.metaMessages.join("\n"));
      }
      throw new Error(e);
    }
  }

  protected abstract buildSendQueryArgs(): Promise<AxiomV2SendQueryArgs>;
}
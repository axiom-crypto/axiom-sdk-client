import { AxiomCircuit } from "../js";
import { 
  AxiomV2ClientConfig,
  AxiomV2ClientOptions,
  AxiomV2CompiledCircuit,
  AxiomV2SendQueryArgs,
} from "./types";
import { RawInput } from "@axiom-crypto/circuit/types";
import { convertChainIdToViemChain, convertInputSchemaToJsonString } from "./utils";
import { TransactionReceipt, createPublicClient, createWalletClient, http, zeroAddress, zeroHash } from "viem";
import { privateKeyToAccount } from 'viem/accounts'
import { AxiomV2Callback, AxiomV2ComputeQuery } from "@axiom-crypto/core";
import { ClientConstants } from "../constants";
import { IpfsClient, PinataIpfsClient } from "../lib/ipfs";

export class Axiom<T> {
  protected config: AxiomV2ClientConfig<T>;
  protected axiomCircuit: AxiomCircuit<T>;
  protected compiledCircuit: AxiomV2CompiledCircuit;
  protected callback: AxiomV2Callback;
  protected options?: AxiomV2ClientOptions;

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
  }

  async init() {
    await this.axiomCircuit.loadSaved({
      config: this.compiledCircuit.config,
      vk: this.compiledCircuit.vk,
    });
  }

  async getSendQueryArgs() {
    const {
      account,
      options,
    } = await this.prepareSendQuery();
    return await this.axiomCircuit.getSendQueryArgs({
      callbackTarget: this.callback.target,
      callbackExtraData: this.callback.extraData ?? "0x",
      callerAddress: account.address,
      options,
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
    const {
      publicClient,
      walletClient,
      account,
      options,
    } = await this.prepareSendQuery();
    const args = await this.axiomCircuit.getSendQueryArgs({
      callbackTarget: this.callback.target,
      callbackExtraData: this.callback.extraData ?? "0x",
      callerAddress: account.address,
      options,
    });

    try {
      const { request } = await publicClient.simulateContract({
        address: args.address as `0x${string}`,
        abi: args.abi,
        functionName: args.functionName,
        args: args.args,
        account,
        value: args.value,
      });
      const hash = await walletClient.writeContract(request);
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
    const {
      publicClient,
      walletClient,
      account,
      options,
    } = await this.prepareSendQuery(this.config.ipfsClient);
    const args = await this.axiomCircuit.getSendQueryArgs({
      callbackTarget: this.callback.target,
      callbackExtraData: this.callback.extraData ?? "0x",
      callerAddress: account.address,
      options,
    });

    try { 
      const { request } = await publicClient.simulateContract({
        address: args.address as `0x${string}`,
        abi: args.abi,
        functionName: args.functionName,
        args: args.args,
        account,
        value: args.value,
      });
      const hash = await walletClient.writeContract(request);
      return await publicClient.waitForTransactionReceipt({ hash });
    } catch (e: any) {
      if (e?.metaMessages !== undefined) {
        throw new Error(e.metaMessages.join("\n"));
      }
      throw new Error(e);
    }
  }

  private async prepareSendQuery(ipfsClient?: IpfsClient) {
    if (this.config.privateKey === undefined) {
      throw new Error("Setting `privateKey` is required to send a Query on-chain");
    }
    const publicClient = createPublicClient({
      chain: convertChainIdToViemChain(this.config.chainId),
      transport: http(this.config.provider),
    })
    const account = privateKeyToAccount(this.config.privateKey as `0x${string}`);
    const walletClient = createWalletClient({
      chain: convertChainIdToViemChain(this.config.chainId),
      account,
      transport: http(this.config.provider),
    })

    const options: AxiomV2ClientOptions = {
      ...this.options,
      callbackGasLimit: this.options?.callbackGasLimit ?? ClientConstants.CALLBACK_GAS_LIMIT,
      refundee: this.options?.refundee ?? account.address,
      ipfsClient,
    }

    return {
      publicClient,
      walletClient,
      account,
      options,
    }
  }
}
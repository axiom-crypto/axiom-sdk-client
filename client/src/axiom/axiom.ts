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
import { AxiomV2Callback } from "@axiom-crypto/core";
import { ClientConstants } from "../constants";

export class Axiom<T> {
  protected config: AxiomV2ClientConfig<T>;
  protected axiomCircuit: AxiomCircuit<T>;
  protected compiledCircuit: AxiomV2CompiledCircuit;
  protected callback: AxiomV2Callback;
  protected options?: AxiomV2ClientOptions;

  constructor(config: AxiomV2ClientConfig<T>) {
    this.config = config;
    const inputSchema = convertInputSchemaToJsonString(config.inputSchema);
    this.compiledCircuit = config.compiledCircuit;
    this.callback = {
      target: config.callback.target,
      extraData: config.callback.extraData ?? "0x",
    };

    this.axiomCircuit = new AxiomCircuit({
      f: config.circuit,
      provider: this.config.provider,
      inputSchema,
      chainId: this.config.chainId,
    });
  }

  async init() {
    await this.axiomCircuit.loadSaved({
      config: this.compiledCircuit.config,
      vk: this.compiledCircuit.vk,
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

  async prove(input: RawInput<T>): Promise<AxiomV2SendQueryArgs> {
    await this.axiomCircuit.run(input);

    const caller = this.config.privateKey !== undefined ? 
      privateKeyToAccount(this.config.privateKey as `0x${string}`).address as string : 
      this.options?.caller ?? "";

    const options: AxiomV2ClientOptions = {
      ...this.options,
      callbackGasLimit: this.options?.callbackGasLimit ?? ClientConstants.CALLBACK_GAS_LIMIT,
      refundee: this.options?.refundee ?? caller,
    }

    return await this.axiomCircuit.getSendQueryArgs({
      callbackTarget: this.callback.target,
      callbackExtraData: this.callback.extraData ?? "0x",
      callerAddress: caller,
      options,
    });
  }

  async sendQuery(args: AxiomV2SendQueryArgs): Promise<TransactionReceipt> {
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
}
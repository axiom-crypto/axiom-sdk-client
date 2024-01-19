import { AxiomCircuit } from "../js";
import { 
  AxiomV2ClientConfig,
  AxiomV2ClientParams,
  AxiomV2CompiledCircuit,
  AxiomV2SendQueryArgs,
  CircuitInputType,
} from "./types";
import { RawInput } from "@axiom-crypto/circuit/types";
import { convertChainIdToViemChain, convertInputSchemaToJsonString } from "./utils";
import { TransactionReceipt, createPublicClient, createWalletClient, http, zeroAddress, zeroHash } from "viem";
import { privateKeyToAccount } from 'viem/accounts'
import { AxiomV2Callback, AxiomV2QueryOptions } from "@axiom-crypto/core";

export class Axiom<T> {
  protected config: AxiomV2ClientConfig<T>;
  protected axiomCircuit: AxiomCircuit<T>;
  protected compiledCircuit: AxiomV2CompiledCircuit;
  protected callback: AxiomV2Callback;
  protected params?: AxiomV2ClientParams;

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
      mock: this.config.mock ?? false,
    });
  }

  async init() {
    await this.axiomCircuit.loadSaved({
      config: this.compiledCircuit.config,
      vk: this.compiledCircuit.vk,
    });
  }

  setParams(params: AxiomV2ClientParams) {
    this.params = { 
      ...this.params,
      ...params,
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
      this.params?.caller ?? "";

    const options: AxiomV2QueryOptions = {
      maxFeePerGas: this.params?.maxFeePerGas,
      callbackGasLimit: this.params?.callbackGasLimit,
      overrideAxiomQueryFee: this.params?.overrideAxiomQueryFee,
      dataQueryCalldataGasWarningThreshold: this.params?.callbackGasLimit,
      refundee: this.params?.refundee ?? caller,
    }

    return await this.axiomCircuit.getSendQueryArgs({
      callbackTarget: this.callback.target,
      callbackExtraData: this.callback.extraData ?? "0x",
      callerAddress: caller,
      options,
    });
  }

  async sendQuery(args: AxiomV2SendQueryArgs): Promise<TransactionReceipt> {
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
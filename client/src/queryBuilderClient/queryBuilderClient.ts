import {
  AxiomV2Callback,
  AxiomV2ComputeQuery,
  QueryBuilderBase,
} from "@axiom-crypto/circuit";
import { 
  parseAddress,
} from "@axiom-crypto/circuit/queryBuilderBase/configure";
import { AxiomV2FeeData, getCallbackHash, getQueryId, Subquery } from "@axiom-crypto/tools";
import { AxiomV2QueryOptions } from "../types";
import { bytesToHex, zeroAddress } from "viem";
import { 
  QueryBuilderClientConfig,
  QueryBuilderClientInternalConfig,
  BuiltQueryV2,
} from "./types";
import { getChainDefaults } from "../lib/chain";
import { getRandomValues } from "crypto";

/**
 * QueryBuilderClient builds queries that can be sent to the deployed AxiomV2Query contract on-chain.
 */
export class QueryBuilderClient extends QueryBuilderBase {
  // Configuration object
  readonly config: QueryBuilderClientInternalConfig;

  // Built query object; undefined until built
  protected builtQuery?: BuiltQueryV2;

  // Information about the callback contract for the query
  protected callback?: AxiomV2Callback;

  // Query options and overrides
  protected options: AxiomV2QueryOptions;

  constructor(
    config: QueryBuilderClientConfig,
    dataQuery?: Subquery[],
    computeQuery?: AxiomV2ComputeQuery,
    callback?: AxiomV2Callback,
    options?: AxiomV2QueryOptions,
  ) {
    super(config, dataQuery, computeQuery);
    this.config = this.configure(config);
    if (callback !== undefined) {
      this.callback = this.handleCallback(callback);
    }
    this.options = this.setOptions(options ?? {});
  }

  protected configure(config: QueryBuilderClientConfig): QueryBuilderClientInternalConfig {
    const baseConfig = super.configure(config);
    let caller = "";
    if (config.caller !== undefined) {
      caller = parseAddress(config.caller);
    }
    let refundee = caller;
    if (config.refundee !== undefined) {
      refundee = parseAddress(config.refundee);
    }

    return {
      providerUri: baseConfig.providerUri,
      provider: baseConfig.provider,
      sourceChainId: baseConfig.sourceChainId,
      targetChainId: baseConfig.targetChainId,
      version: baseConfig.version,
      mock: baseConfig.mock,
      caller,
      refundee,
    };
  }

  async build(validate?: boolean): Promise<BuiltQueryV2> {
    if (this.config.refundee === "" && this.config.caller === "") {
      throw new Error("`caller` or `refundee` in config required to build the Query");
    }

    if (validate === true) {
      const valid = await this.validate();
      if (!valid) {
        throw new Error("Query validation failed");
      }
    }

    const builtQueryBase = await super.buildBase(validate);

    // Handle callback
    const callback = {
      target: this.callback?.target ?? zeroAddress,
      extraData: this.callback?.extraData ?? zeroAddress,
    };

    // FeeData
    const feeData: AxiomV2FeeData = {
      maxFeePerGas: this.options.maxFeePerGas!,
      callbackGasLimit: this.options.callbackGasLimit!,
      overrideAxiomQueryFee: this.options.overrideAxiomQueryFee!,
    };

    // Get the refundee address
    let refundee = this.config.refundee;
    if (this.config.refundee === "") {
      refundee = this.config.caller;
    }

    // Calculate a salt
    const userSalt = this.calculateUserSalt();

    this.builtQuery = {
      sourceChainId: builtQueryBase.sourceChainId.toString(),
      targetChainId: builtQueryBase.targetChainId.toString(),
      queryHash: builtQueryBase.queryHash,
      dataQuery: builtQueryBase.dataQuery,
      dataQueryHash: builtQueryBase.dataQueryHash,
      dataQueryStruct: builtQueryBase.dataQueryStruct,
      computeQuery: builtQueryBase.computeQuery,
      querySchema: builtQueryBase.querySchema,
      callback,
      feeData,
      userSalt,
      refundee,
    };

    return this.builtQuery!;
  }


  /**
   * Gets the callback information
   * @returns The current callback information
   */
  getCallback(): AxiomV2Callback | undefined {
    return this.callback;
  }

  /**
   * Gets the current Query options
   * @returns The current Query options
   */
  getOptions(): AxiomV2QueryOptions {
    return this.options;
  }

  /**
   * Gets the built Query if it exists
   * @returns The built Query or undefined if it has not yet been built
   */
  getBuiltQuery(): BuiltQueryV2 | undefined {
    return this.builtQuery;
  }

  setCallback(callback: AxiomV2Callback) {
    this.unsetBuiltQuery();
    this.callback = this.handleCallback(callback);
  }

  setOptions(options: AxiomV2QueryOptions): AxiomV2QueryOptions {
    this.unsetBuiltQuery();
    const defaults = getChainDefaults(this.config.sourceChainId.toString());
    const newOptions = {
      ...options,
      maxFeePerGas: options?.maxFeePerGas ?? defaults.maxFeePerGasWei.toString(),
      callbackGasLimit: options?.callbackGasLimit ?? Number(defaults.callbackGasLimit),
      overrideAxiomQueryFee: options?.overrideAxiomQueryFee ?? "0",
    };
    return newOptions;
  }

  async validate(): Promise<boolean> {
    const baseValid = await super.validate();

    // Check if callback is valid
    const callback = await this.validateCallback();

    return baseValid && callback;
  }

  protected unsetBuiltQuery() {
    // Reset built query if any data is changed
    this.builtQuery = undefined;
  }

  /**
   * Gets a queryId for a built Query
   * @returns uint256 queryId
   */
  async getQueryId(caller?: string): Promise<string> {
    if (this.builtQuery === undefined) {
      throw new Error("Must query with `build()` first before getting queryId");
    }

    // Get required queryId params
    if (caller === undefined) {
      caller = this.config.caller;
    }
    const targetChainId = this.builtQuery.targetChainId;
    const refundee = this.config.refundee;
    const salt = this.builtQuery.userSalt;
    const queryHash = this.builtQuery.queryHash;
    const callbackHash = getCallbackHash(this.builtQuery.callback.target, this.builtQuery.callback.extraData);

    // Calculate the queryId
    const queryId = getQueryId(targetChainId, caller, salt, queryHash, callbackHash, refundee);
    return BigInt(queryId).toString();
  }

  protected calculateUserSalt(): string {
    const randomBytes = getRandomValues(new Uint8Array(32))
    return bytesToHex(randomBytes);
  }

  protected handleCallback(callback: AxiomV2Callback): AxiomV2Callback {
    callback.target = callback.target.toLowerCase();
    callback.extraData = callback.extraData.toLowerCase();
    return callback;
  }


  protected async validateCallback(): Promise<boolean> {
    if (this.callback === undefined) {
      return true;
    }
    let valid = true;

    let target = this.callback.target;
    if (target === undefined || target === "" || target === zeroAddress) {
      console.warn("Callback target is empty");
      valid = false;
    }

    let extraData = this.callback.extraData;
    if (extraData === undefined) {
      console.warn("Callback extraData is undefined");
      valid = false;
    } else {
      // Check if extra data is bytes32-aligned
      if (extraData.startsWith("0x")) {
        extraData = extraData.slice(2);
      }
      if (extraData.length % 64 !== 0) {
        console.warn(
          "Callback extraData is not bytes32-aligned; EVM will automatically right-append zeros to data that is not a multiple of 32 bytes, which is probably not what you want.",
        );
        valid = false;
      }
    }

    return valid;
  }
}
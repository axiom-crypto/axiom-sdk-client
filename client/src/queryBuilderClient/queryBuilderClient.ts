import {
  AxiomV2Callback,
  AxiomV2ComputeQuery,
  AxiomV2DataQuery,
  AxiomV2QueryBuilderBase,
  BuiltQueryV2,
} from "@axiom-crypto/circuit";
import { AxiomV2FeeData } from "@axiom-crypto/tools";
import { AxiomV2ClientOptions } from "src/types";
import { zeroAddress } from "viem";

export class AxiomV2QueryBuilderClient {
  readonly config: InternalConfig;
  private queryBuilderBase: AxiomV2QueryBuilderBase;
  private builtQuery?: BuiltQueryV2;
  private builtDataQuery?: AxiomV2DataQuery;
  private dataQuery?: Subquery[];
  private computeQuery?: AxiomV2ComputeQuery;
  private callback?: AxiomV2Callback;
  private options: AxiomV2QueryOptions;

  constructor(
    config: AxiomV2QueryBuilderClientConfig,
    dataQuery?: Subquery[],
    computeQuery?: AxiomV2ComputeQuery,
    callback?: AxiomV2Callback,
    options?: AxiomV2ClientOptions,
  ) {

    if (callback !== undefined) {
      this.callback = this.handleCallback(callback);
    }
    this.queryBuilderBase = new AxiomV2QueryBuilderBase(config, dataQuery, computeQuery);
  }

  async build(): Promise<BuiltQueryV2> {
    this.builtQuery = await this.queryBuilderBase.build());


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
      sourceChainId: this.config.sourceChainId.toString(),
      targetChainId: this.config.targetChainId.toString(),
      queryHash,
      dataQuery,
      dataQueryHash,
      dataQueryStruct,
      computeQuery,
      querySchema,
      callback,
      feeData,
      userSalt,
      refundee,
    };

    return this.builtQuery;
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


  setCallback(callback: AxiomV2Callback) {
    this.unsetBuiltQuery();
    this.callback = this.handleCallback(callback);
  }

  setOptions(options: AxiomV2QueryOptions): AxiomV2QueryOptions {
    this.unsetBuiltQuery();
    this.options = {
      maxFeePerGas: options?.maxFeePerGas ?? ConstantsV2.DefaultMaxFeePerGasWei,
      callbackGasLimit: options?.callbackGasLimit ?? ConstantsV2.DefaultCallbackGasLimit,
      overrideAxiomQueryFee: options?.overrideAxiomQueryFee ?? ConstantsV2.DefaultOverrideAxiomQueryFee,
    };
    return this.options;
  }

  /**
   * Appends a built DataQuery. This is used when receiving a DataQuery from a ComputeQuery.
   * Setting this will take precedence over setting any UnbuiltSubqueries via `append()`.
   */
  setBuiltDataQuery(dataQuery: AxiomV2DataQuery, skipValidate?: boolean): void {
    this.queryBuilderBase.setBuiltDataQuery(dataQuery, skipValidate);
  }

  async validate(): Promise<boolean> {
    const baseValid = this.queryBuilderBase.validate();

    // Check if callback is valid
    const callback = await this.validateCallback();

    return baseValid && callback;
  }


  private unsetBuiltQuery() {
    // Reset built query if any data is changed
    this.builtQuery = undefined;
  }

  /**
   * Gets a queryId for a built Query
   * @returns uint256 queryId
   */
  async getQueryId(caller?: string): Promise<string> {
    if (this.builtQueryBase === undefined) {
      throw new Error("Must query with `build()` first before getting queryId");
    }

    // Get required queryId params
    if (caller === undefined) {
      caller = this.config.caller;
    }
    const targetChainId = this.builtQueryBase.targetChainId;
    const refundee = this.config.refundee;
    const salt = this.builtQueryBase.userSalt;
    const queryHash = this.builtQueryBase.queryHash;
    const callbackHash = getCallbackHash(this.builtQueryBase.callback.target, this.builtQueryBase.callback.extraData);

    // Calculate the queryId
    const queryId = getQueryId(targetChainId, caller, salt, queryHash, callbackHash, refundee);
    return BigInt(queryId).toString();
  }

  private calculateUserSalt(): string {
    return ethers.hexlify(ethers.randomBytes(32));
  }

  private handleCallback(callback: AxiomV2Callback): AxiomV2Callback {
    callback.target = callback.target.toLowerCase();
    callback.extraData = callback.extraData.toLowerCase();
    return callback;
  }


  private async validateCallback(): Promise<boolean> {
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
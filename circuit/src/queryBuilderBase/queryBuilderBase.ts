import { ethers } from "ethers";
import {
  AxiomV2ComputeQuery,
  DataSubqueryType,
  bytes32,
  getQuerySchemaHash,
  getQueryHashV2,
  getDataQueryHashFromSubqueries,
  AxiomV2CircuitConstant,
  AxiomV2DataQuery,
  Subquery,
  HeaderSubquery,
  AccountSubquery,
  StorageSubquery,
  TxSubquery,
  ReceiptSubquery,
  SolidityNestedMappingSubquery,
  BeaconValidatorSubquery,
} from "@axiom-crypto/tools";
import {
  DataSubqueryCount,
  QueryBuilderBaseConfig,
  BuiltQueryV2Base,
  QueryBuilderBaseInternalConfig,
} from "./types";
import { ConstantsV2 } from "./constants";
import {
  validateAccountSubquery,
  validateHeaderSubquery,
  validateStorageSubquery,
  validateTxSubquery,
  validateReceiptSubquery,
  validateSolidityNestedMappingSubquery,
  validateBeaconSubquery,
} from "./dataSubquery/validate";
import { getSubqueryTypeFromKeys } from "./utils";
import { formatDataQuery, formatDataSubqueries, encodeBuilderDataQuery } from "./dataSubquery/format";
import { deepCopyObject } from "../utils";
import { ConfigLimitManager } from "./dataSubquery/configLimitManager";
import { handleChainId, handleProvider, parseChainId, parseMock, parseRpcUrl, parseVersion } from "./configure";

/**
 * Base class for building Axiom queries. This is a base class is used to eventually build a dataQuery and computeQuery into a 
 * format that can be sent onchain. However, it requires QueryBuilderClient to build the client-facing pieces of the query. Most 
 * users will want to use QueryBuilderClient instead of this class.
 */
export class QueryBuilderBase {
  // Configuration object
  readonly config: QueryBuilderBaseInternalConfig;

  // Built Query base object; undefined if Query has not been built yet
  protected builtQueryBase?: BuiltQueryV2Base;

  // The set of data subqueries 
  protected dataQuery?: Subquery[];

  // The compute query
  protected computeQuery?: AxiomV2ComputeQuery;

  // An object that handles the counts of all subquery types
  protected dataSubqueryCount: DataSubqueryCount;

  constructor(
    config: QueryBuilderBaseConfig,
    dataQuery?: Subquery[],
    computeQuery?: AxiomV2ComputeQuery,
  ) {
    this.config = this.configure(config);
    this.dataSubqueryCount = deepCopyObject(ConstantsV2.EmptyDataSubqueryCount);
    if (dataQuery !== undefined) {
      this.append(dataQuery);
    }
    if (computeQuery !== undefined) {
      this.computeQuery = this.handleComputeQueryRequest(computeQuery);
    }
  }

  protected configure(config: QueryBuilderBaseConfig): QueryBuilderBaseInternalConfig {
    config = handleProvider(config);
    const rpcUrl = parseRpcUrl(config.rpcUrl);

    config = handleChainId(config);
    const sourceChainId = parseChainId(config.sourceChainId);
    const targetChainId = parseChainId(config.targetChainId);

    const mock = parseMock(config.mock, sourceChainId);
    const version = parseVersion(config.version);

    const provider = new ethers.JsonRpcProvider(rpcUrl);

    return {
      rpcUrl,
      provider,
      sourceChainId,
      targetChainId,
      mock,
      version,
    };
  }

  /**
   * Gets the current set of unbuilt data subqueries
   * @returns Array of unbuilt data subqueries
   */
  getDataQuery(): Subquery[] | undefined {
    return this.dataQuery;
  }

  /**
   * Gets the current compute query
   * @returns The current compute query
   */
  getComputeQuery(): AxiomV2ComputeQuery | undefined {
    return this.computeQuery;
  }


  /**
   * Gets the current count of each type of data subquery
   * @returns Subquery counts
   */
  getDataSubqueryCount(): DataSubqueryCount {
    return this.dataSubqueryCount;
  }

  /**
   * Gets the built Query. Built Query resets if any data is changed.
   * @returns The built Query; undefined if Query has not been built yet
   */
  getBuiltQueryBase(): BuiltQueryV2Base | undefined {
    return this.builtQueryBase;
  }

  /**
   * Gets the hash of the querySchema of the computeQuery
   * @returns Query schema hash
   */
  getQuerySchema(): string {
    return getQuerySchemaHash(
      this.computeQuery?.k ?? 0,
      this.computeQuery?.resultLen ?? this.getDefaultResultLen(),
      this.computeQuery?.vkey ?? [],
    );
  }

  /**
   * Gets the hash of the data query
   * @returns Data query hash
   */
  getDataQueryHash(): string {
    if (this.builtQueryBase === undefined) {
      throw new Error(
        "Query must first be built with `.build()` before getting data query hash. If Query is modified after building, you will need to run `.build()` again.",
      );
    }
    return getDataQueryHashFromSubqueries(this.config.sourceChainId.toString(), this.builtQueryBase.dataQueryStruct.subqueries);
  }

  getQueryHash(): string {
    if (this.builtQueryBase === undefined) {
      throw new Error(
        "Query must first be built with `.build()` before getting query hash. If Query is modified after building, you will need to run `.build()` again.",
      );
    }
    const computeQuery = this.computeQuery ?? deepCopyObject(ConstantsV2.EmptyComputeQueryObject);
    return getQueryHashV2(this.config.sourceChainId.toString(), this.getDataQueryHash(), computeQuery);
  }

  setDataQuery(dataQuery: Subquery[]) {
    this.unsetBuiltQueryBase();
    this.dataQuery = undefined;
    this.append(dataQuery);
  }

  setComputeQuery(computeQuery: AxiomV2ComputeQuery) {
    this.unsetBuiltQueryBase();
    this.computeQuery = this.handleComputeQueryRequest(computeQuery);
  }

  setMock(mock: boolean) {
    this.config.mock = mock;
  }

  /**
   * Append a `Subquery[]` object to the current dataQuery
   * @param dataQuery A `Subquery[]` object to append
   */
  append(dataSubqueries: Subquery[], skipValidate?: boolean): void {
    this.unsetBuiltQueryBase();

    if (this.dataQuery === undefined) {
      this.dataQuery = [] as Subquery[];
    }

    if (this.dataQuery?.length + dataSubqueries.length > ConstantsV2.UserMaxTotalSubqueries) {
      throw new Error(`Cannot add more than ${ConstantsV2.UserMaxTotalSubqueries} subqueries`);
    }

    // Append new dataSubqueries to existing dataQuery
    this.dataQuery = [...(this.dataQuery ?? []), ...dataSubqueries];
    if (!skipValidate) {
      this.validateSubqueryCount();
    }
  }

  /**
   * Appends a single subquery to the current dataQuery
   * @param dataSubquery The data of the subquery to append
   * @param type (optional) The type of subquery to append. If not provided, the type will be
   *             inferred from the keys of the subquery.
   */
  appendDataSubquery(dataSubquery: Subquery): void {
    this.append([dataSubquery]);
  }

  /**
   * Appends an already-built DataQuery. This is used when receiving an already-built DataQuery 
   * from some other service. Setting this will override any currently appended subqueries.
   */
  setBuiltDataQuery(dataQuery: AxiomV2DataQuery, skipValidate?: boolean): void {
    this.dataQuery = dataQuery.subqueries.map((subquery) => subquery.subqueryData);
    if (!skipValidate) {
      this.validateSubqueryCount();
    }
  }

  /**
   * Queries the required subquery data and builds the entire Query object into the format
   * that is required by the backend/ZK circuit
   * @param validate (optional) Runs validation on the Query before attempting to build it
   * @returns A built Query object
   */
  async buildBase(validate?: boolean): Promise<BuiltQueryV2Base> {
    if (validate === true) {
      const valid = await this.validate();
      if (!valid) {
        throw new Error("Query validation failed");
      }
    }

    // Check if Query can be built: needs at least a dataQuery or computeQuery
    let validDataQuery = true;
    if (this.dataQuery === undefined || this.dataQuery.length === 0) {
      validDataQuery = false;
    }
    let validComputeQuery = true;
    if (this.computeQuery === undefined || this.computeQuery.k === 0) {
      validComputeQuery = false;
    }
    if (!validDataQuery && !validComputeQuery) {
      throw new Error("Cannot build Query without either a data query or a compute query");
    }

    // Handle Data Query
    // Parse and get fetch appropriate data for all data subqueries
    const builtDataSubqueries = await formatDataSubqueries(this.dataQuery ?? []);

    // Encode & build data query
    const dataQuery = encodeBuilderDataQuery(this.config.sourceChainId, builtDataSubqueries);
    const dataQueryHash = getDataQueryHashFromSubqueries(this.config.sourceChainId.toString(), builtDataSubqueries);
    const dataQueryStruct = formatDataQuery(this.config.sourceChainId, builtDataSubqueries);
    
    // Handle compute query
    let defaultResultLen = this.getDefaultResultLen();
    let computeQuery: AxiomV2ComputeQuery = {
      k: 0,
      resultLen: defaultResultLen,
      vkey: [] as string[],
      computeProof: "0x00",
    };
    if (this.computeQuery !== undefined) {
      computeQuery.k = this.computeQuery.k;
      computeQuery.resultLen = this.computeQuery?.resultLen ?? defaultResultLen;
      computeQuery.vkey = this.computeQuery.vkey;
      computeQuery.computeProof = this.computeQuery.computeProof;
    }

    const querySchema = getQuerySchemaHash(
      computeQuery.k,
      computeQuery.resultLen ?? defaultResultLen,
      computeQuery.vkey,
    );

    // Get the hash of the full Query
    const queryHash = getQueryHashV2(this.config.sourceChainId.toString(), dataQueryHash, computeQuery);

    this.builtQueryBase = {
      sourceChainId: this.config.sourceChainId.toString(),
      targetChainId: this.config.targetChainId.toString(),
      queryHash,
      dataQuery,
      dataQueryHash,
      dataQueryStruct,
      computeQuery,
      querySchema,
    };

    return this.builtQueryBase;
  }

  /**
   * @returns {boolean} Whether the query is valid or not
   */
  async validate(): Promise<boolean> {
    // Check if data subqueries are valid
    const data = await this.validateDataSubqueries();

    // Check if compute query is valid
    const compute = await this.validateComputeQuery();

    return data && compute;
  }

  private unsetBuiltQueryBase() {
    // Reset built query if any data is changed
    this.builtQueryBase = undefined;
  }

  private getDefaultResultLen(): number {
    return Math.min(this.dataQuery?.length ?? 0, AxiomV2CircuitConstant.UserMaxOutputs);
  }

  protected handleComputeQueryRequest(computeQuery: AxiomV2ComputeQuery) {
    computeQuery.resultLen = computeQuery.resultLen ?? this.getDefaultResultLen();
    computeQuery.vkey = computeQuery.vkey.map((x: string) => bytes32(x));
    return computeQuery;
  }

  protected async validateDataSubqueries(): Promise<boolean> {
    if (this.dataQuery === undefined || this.dataQuery.length === 0) {
      return true;
    }
    const provider = this.config.provider;
    let validQuery = true;
    const configLimitManager = new ConfigLimitManager();

    for (const subquery of this.dataQuery) {
      const type = getSubqueryTypeFromKeys(Object.keys(subquery));
      switch (type) {
        case DataSubqueryType.Header:
          validQuery = validQuery && (await validateHeaderSubquery(provider, subquery as HeaderSubquery));
          break;
        case DataSubqueryType.Account:
          validQuery = validQuery && (await validateAccountSubquery(provider, subquery as AccountSubquery));
          break;
        case DataSubqueryType.Storage:
          validQuery = validQuery && (await validateStorageSubquery(provider, subquery as StorageSubquery));
          break;
        case DataSubqueryType.Transaction:
          validQuery =
            validQuery && (await validateTxSubquery(provider, subquery as TxSubquery, configLimitManager));
          break;
        case DataSubqueryType.Receipt:
          validQuery =
            validQuery &&
            (await validateReceiptSubquery(provider, subquery as ReceiptSubquery, configLimitManager));
          break;
        case DataSubqueryType.SolidityNestedMapping:
          validQuery =
            validQuery &&
            (await validateSolidityNestedMappingSubquery(provider, subquery as SolidityNestedMappingSubquery));
          break;
        case DataSubqueryType.BeaconValidator:
          validQuery =
            validQuery && (await validateBeaconSubquery(provider, subquery as BeaconValidatorSubquery));
          break;
        default:
          throw new Error(`Invalid subquery type: ${type}`);
      }
    }
    return validQuery;
  }

  protected async validateComputeQuery(): Promise<boolean> {
    if (this.computeQuery === undefined) {
      return true;
    }
    let valid = true;

    // Check resultLen
    if (
      this.computeQuery.resultLen !== undefined &&
      this.computeQuery.resultLen > AxiomV2CircuitConstant.UserMaxOutputs
    ) {
      console.warn(`Callback resultLen is greater than maxOutputs (${AxiomV2CircuitConstant.UserMaxOutputs})`);
      valid = false;
    }

    // Check that vkey and computeProof are not zero if k is nonzero
    if (this.computeQuery.k !== 0) {
      if (this.computeQuery.vkey.length === 0) {
        console.warn("Compute query vkey is empty");
        valid = false;
      }
      if (this.computeQuery.computeProof.length === 0) {
        console.warn("Compute query computeProof is empty");
        valid = false;
      }
    }

    return valid;
  }

  protected validateSubqueryCount() {
    if (this.dataQuery && this.dataQuery.length > ConstantsV2.UserMaxTotalSubqueries) {
      throw new Error(`Number of subqueries (${this.dataQuery.length}) exceeds maximum of ${ConstantsV2.UserMaxTotalSubqueries} subqueries`);
    }
  }
}

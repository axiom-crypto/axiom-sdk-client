import { CircuitConfig, Halo2LibWasm } from "@axiom-crypto/halo2-lib-js/wasm/web";
import { base64ToByteArray, byteArrayToBase64, convertToBytes, convertToBytes32 } from "./utils";
import { concat, zeroHash } from "viem";
import { AxiomCircuitRunner } from "./circuitRunner";
import {
  AxiomV2ComputeQuery,
  DataSubquery,
  getQuerySchemaHash,
} from "@axiom-crypto/tools";
import { AxiomV2QueryBuilderBase } from "./queryBuilderBase";
import { BaseCircuitScaffold } from "@axiom-crypto/halo2-lib-js";
import { DEFAULT_CAPACITY, DEFAULT_CIRCUIT_CONFIG, SUBQUERY_FE, USER_OUTPUT_FE } from "./constants";
import { AxiomV2CircuitCapacity, AxiomV2CircuitConfig, RawInput } from "./types";
import { encodeAxiomV2CircuitMetadata } from "./encoder";

const DEADBEEF_BYTES32 = "0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef";

export abstract class AxiomBaseCircuitScaffold<T> extends BaseCircuitScaffold {
  protected resultLen: number;
  protected halo2Lib!: Halo2LibWasm;
  protected provider: string;
  protected dataQuery: DataSubquery[];
  protected queryBuilderBase: AxiomV2QueryBuilderBase;
  protected computeQuery: AxiomV2ComputeQuery | undefined;
  protected chainId: string;
  protected f: (inputs: T) => Promise<void>;
  protected results: { [key: string]: string };
  protected inputSchema?: string;
  protected capacity: AxiomV2CircuitCapacity;

  constructor(inputs: {
    provider: string,
    f: (inputs: T) => Promise<void>,
    inputSchema?: string | object,
    config?: CircuitConfig,
    mock?: boolean,
    chainId?: number | string | bigint,
    shouldTime?: boolean,
    results?: { [key: string]: string },
    capacity?: AxiomV2CircuitCapacity,
  }) {
    super();
    this.resultLen = 0;
    this.provider = inputs.provider;
    this.config = inputs.config ?? DEFAULT_CIRCUIT_CONFIG;
    this.capacity = inputs.capacity ?? DEFAULT_CAPACITY;
    if (
      this.capacity?.maxOutputs !== DEFAULT_CAPACITY.maxOutputs || 
      this.capacity?.maxSubqueries !== DEFAULT_CAPACITY.maxSubqueries
    ) {
      console.warn("Using a non-default capacity for the circuit will result in a query that cannot be fulfilled on-chain.");
    }
    
    this.dataQuery = [];
    this.queryBuilderBase = new AxiomV2QueryBuilderBase({
      provider: inputs.provider,
      sourceChainId: inputs.chainId,
      mock: inputs.mock,
      version: "v2",
    });
    this.chainId = inputs.chainId?.toString() ?? "undefined";
    this.shouldTime = inputs.shouldTime ?? false;
    this.loadedVk = false;
    this.f = inputs.f;
    if (inputs.inputSchema instanceof Object) {
      inputs.inputSchema = JSON.stringify(inputs.inputSchema);
    }
    else if (typeof inputs.inputSchema === "string") {
      try {
        JSON.parse(inputs.inputSchema);
      }
      catch (e) {
        let byteArray = base64ToByteArray(inputs.inputSchema);
        let dec = new TextDecoder();
        inputs.inputSchema = dec.decode(byteArray);
      }
    }
    this.inputSchema = inputs.inputSchema;
    this.results = inputs.results ?? {};
  }

  getResults() {
    return { ...this.results };
  }

  async loadSaved(input: {
    vk: string;
    config: CircuitConfig;
    capacity?: AxiomV2CircuitCapacity;
  }) {
    this.config = input.config;
    this.capacity = input.capacity ?? DEFAULT_CAPACITY;
    await this.loadParamsAndVk(base64ToByteArray(input.vk));
  }

  loadSavedMock(input: {
    config: CircuitConfig;
    capacity?: AxiomV2CircuitCapacity;
  }) {
    this.config = input.config;
    this.capacity = input.capacity ?? DEFAULT_CAPACITY;
  }

  circuitConfig(): AxiomV2CircuitConfig {
    return {
      config: this.config,
      capacity: this.capacity,
    }
  }

  getQuerySchema() {
    const partialVk = this.getPartialVk();
    const vkBytes = convertToBytes32(partialVk);
    const onchainVk = this.prependCircuitMetadata(vkBytes);
    const querySchema = getQuerySchemaHash(this.config.k, this.resultLen, onchainVk);
    return querySchema;
  }

  prependCircuitMetadata(partialVk: string[]): string[] {
    const encodedCircuitMetadata = encodeAxiomV2CircuitMetadata({
      version: 0,
      numValuesPerInstanceColumn: [
        this.capacity.maxOutputs * USER_OUTPUT_FE +
        this.capacity.maxSubqueries * SUBQUERY_FE
      ],
      numChallenge: [0],
      isAggregation: false,
      numAdvicePerPhase: [this.config.numAdvice],
      numLookupAdvicePerPhase: [this.config.numLookupAdvice],
      numRlcColumns: 0,
      numFixed: 1,
      maxOutputs: this.capacity.maxOutputs,
    });
    return [encodedCircuitMetadata, ...partialVk];
  }

  async compile(inputs: RawInput<T>) {
    this.newCircuitFromConfig(this.config);
    this.timeStart("Witness generation");
    const { config, results } = await AxiomCircuitRunner(
      this.halo2wasm,
      this.halo2Lib,
      this.config,
      this.capacity,
      this.provider,
    ).compile(this.f, inputs, this.inputSchema);
    this.timeEnd("Witness generation");
    this.config = config;
    this.results = results;
    await this.populateCircuit(inputs);

    let skipValidate = this.capacity !== DEFAULT_CAPACITY;
    
    // Validate max circuit subquery size
    this.queryBuilderBase.setBuiltDataQuery({
      sourceChainId: this.chainId,
      subqueries: this.dataQuery,
    }, skipValidate);

    await this.keygen();
    const vk = this.getHalo2Vk();
    const encoder = new TextEncoder();
    const inputSchema = encoder.encode(this.inputSchema);

    return {
      vk: byteArrayToBase64(vk),
      config,
      capacity: this.capacity ?? DEFAULT_CAPACITY,
      querySchema: this.getQuerySchema(),
      inputSchema: byteArrayToBase64(inputSchema),
    };
  }

  async mockCompile(inputs: RawInput<T>) {
    this.newCircuitFromConfig(this.config);
    this.timeStart("Witness generation");
    const { config, results } = await AxiomCircuitRunner(
      this.halo2wasm,
      this.halo2Lib,
      this.config,
      this.capacity,
      this.provider,
    ).compile(this.f, inputs, this.inputSchema);
    this.timeEnd("Witness generation");
    this.config = config;
    this.results = results;
    const vk = this.getMockVk().map(e => e.slice(2)).join('');
    const encoder = new TextEncoder();
    const inputSchema = encoder.encode(this.inputSchema);

    return {
      vk,
      config,
      capacity: this.capacity ?? DEFAULT_CAPACITY,
      querySchema: DEADBEEF_BYTES32,
      inputSchema: byteArrayToBase64(inputSchema),
    };
  }

  async populateCircuit(inputs: RawInput<T>) {
    this.newCircuitFromConfig(this.config);
    this.timeStart("Witness generation");
    const { numUserInstances, dataQuery } = await AxiomCircuitRunner(
      this.halo2wasm,
      this.halo2Lib,
      this.config,
      this.capacity,
      this.provider,
    ).run(this.f, inputs, this.inputSchema, this.results);
    this.timeEnd("Witness generation");
    if (numUserInstances % 2 !== 0) {
      throw new Error("numUserInstances must be even");
    }
    this.resultLen = Math.floor(numUserInstances / 2);
    this.dataQuery = dataQuery;
  }

  async run(inputs: RawInput<T>) {
    await this.populateCircuit(inputs);

    let skipValidate = this.capacity !== DEFAULT_CAPACITY;

    // Validate data subqueries
    this.queryBuilderBase.setBuiltDataQuery({
      sourceChainId: this.chainId,
      subqueries: this.dataQuery,
    }, skipValidate);
    if (!skipValidate && !this.queryBuilderBase.validate()) {
      throw new Error("Subquery validation failed")
    }

    this.prove();
    return this.buildComputeQuery();
  }

  async mockProve(inputs: RawInput<T>) {
    await this.populateCircuit(inputs);
    this.mock();
    return this.buildMockComputeQuery();
  }

  buildComputeQuery() {
    const vk = this.getPartialVk();
    const vkBytes = convertToBytes32(vk);
    const onchainVkey = this.prependCircuitMetadata(vkBytes);

    const computeProofBase = this.getComputeProof() as `0x${string}`;
    const computeAccumulator = concat([zeroHash, zeroHash]);
    const computeProof = concat([computeAccumulator, computeProofBase]);

    const computeQuery: AxiomV2ComputeQuery = {
      k: this.config.k,
      vkey: onchainVkey,
      computeProof,
      resultLen: this.resultLen,
    };
    this.computeQuery = computeQuery;
    return computeQuery;
  }

  private getMockVk(): string[] {
    const vkLen = 6 + 2 * DEFAULT_CIRCUIT_CONFIG.numAdvice + DEFAULT_CIRCUIT_CONFIG.numLookupAdvice;
    const emptyVk = new Array(vkLen).fill(DEADBEEF_BYTES32);
    return emptyVk;
  }

  buildMockComputeQuery() {
    // Mock compute query only works for the following DEFAULT_CIRCUIT_CONFIG:
    if (
      DEFAULT_CIRCUIT_CONFIG.numAdvice !== 4 ||
      DEFAULT_CIRCUIT_CONFIG.numLookupAdvice !== 1 ||
      DEFAULT_CIRCUIT_CONFIG.numInstance !== 1 ||
      DEFAULT_CIRCUIT_CONFIG.numVirtualInstance !== 2
    ) {
      throw new Error(`MockComputeQuery not valid for this DEFAULT_CIRCUIT_CONFIG`);
    }
    const emptyVk = this.getMockVk();
    const onchainVkey = this.prependCircuitMetadata(emptyVk);

    this.proof = new Uint8Array(2080);
    const computeProofBase = this.getComputeProof() as `0x${string}`;
    const computeAccumulator = concat([zeroHash, zeroHash]);
    const computeProof = concat([computeAccumulator, computeProofBase]);

    const computeQuery: AxiomV2ComputeQuery = {
      k: this.config.k,
      vkey: onchainVkey,
      computeProof,
      resultLen: this.resultLen,
    };
    this.computeQuery = computeQuery;
    return computeQuery;
  }

  getComputeProof() {
    if (!this.proof) throw new Error("No proof generated");
    let proofString = this.getComputeResults()
      .map((r) => r.slice(2))
      .join("");
    proofString += convertToBytes(this.proof);
    return "0x" + proofString;
  }

  getComputeResults() {
    const computeResults: string[] = [];
    const instances = this.getInstances();
    for (let i = 0; i < this.resultLen; i++) {
      const instanceHi = BigInt(instances[2 * i]);
      const instanceLo = BigInt(instances[2 * i + 1]);
      const instance = instanceHi * BigInt(2 ** 128) + instanceLo;
      const instanceString = instance.toString(16).padStart(64, "0");
      computeResults.push("0x" + instanceString);
    }
    return computeResults;
  }

  getDataQuery() {
    if (!this.dataQuery) throw new Error("No data query generated");
    return this.dataQuery;
  }

  getChainId() {
    return this.chainId;
  }

  setMock(mock: boolean) {
    this.queryBuilderBase = new AxiomV2QueryBuilderBase({
      provider: this.provider,
      sourceChainId: this.chainId,
      mock,
      version: "v2",
    });
  }
}

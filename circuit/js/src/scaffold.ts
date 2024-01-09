import { CircuitConfig, Halo2LibWasm } from "@axiom-crypto/halo2-wasm/web";
import { keccak256 } from "ethers";
import { base64ToByteArray, byteArrayToBase64, convertToBytes, convertToBytes32 } from "./utils";
import { concat, encodePacked, zeroHash } from "viem";
import { AxiomCircuitRunner } from "./circuitRunner";
import {
  AxiomV2Callback,
  AxiomV2CircuitConstant,
  AxiomV2ComputeQuery,
  DataSubquery,
} from "@axiom-crypto/tools";
import {
  AxiomSdkCore,
  AxiomV2QueryOptions,
} from "@axiom-crypto/core";
import { BaseCircuitScaffold } from "@axiom-crypto/halo2-wasm/shared/scaffold";
import { DEFAULT_CIRCUIT_CONFIG } from "./constants";
import { RawInput } from "./types";
import { encodeAxiomV2CircuitMetadata } from "./encoder";

export abstract class AxiomBaseCircuitScaffold<T> extends BaseCircuitScaffold {
  protected resultLen: number;
  protected halo2Lib!: Halo2LibWasm;
  protected provider: string;
  protected dataQuery: DataSubquery[];
  protected axiom: AxiomSdkCore;
  protected computeQuery: AxiomV2ComputeQuery | undefined;
  protected chainId: string;
  protected f: (inputs: T) => Promise<void>;
  protected results: { [key: string]: string };
  protected inputSchema?: string;

  constructor(inputs: {
    provider: string;
    f: (inputs: T) => Promise<void>;
    inputSchema?: string | object;
    config?: CircuitConfig;
    mock?: boolean;
    chainId?: number | string | bigint;
    shouldTime?: boolean;
  }) {
    super();
    this.resultLen = 0;
    this.provider = inputs.provider;
    this.config = inputs.config ?? DEFAULT_CIRCUIT_CONFIG;
    this.dataQuery = [];
    this.axiom = new AxiomSdkCore({
      providerUri: inputs.provider,
      chainId: inputs.chainId,
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
    this.results = {};
  }

  async loadSaved(input: { config: CircuitConfig; vk: string }) {
    this.config = input.config;
    await this.loadParamsAndVk(base64ToByteArray(input.vk));
  }

  getQuerySchema() {
    const partialVk = this.getPartialVk();
    const vk = convertToBytes32(partialVk);
    const packed = encodePacked(
      ["uint8", "uint16", "uint8", "bytes32[]"],
      [this.config.k, this.resultLen, vk.length, vk as `0x${string}`[]],
    );
    const schema = keccak256(packed);
    return schema as string;
  }

  prependCircuitMetadata(config: CircuitConfig, partialVk: string[]): string[] {
    const SUBQUERY_RESULT_LEN = 1 + AxiomV2CircuitConstant.MaxSubqueryInputs + AxiomV2CircuitConstant.MaxSubqueryOutputs;
    const encodedCircuitMetadata = encodeAxiomV2CircuitMetadata({
      version: 0,
      numValuesPerInstanceColumn: [
        AxiomV2CircuitConstant.UserMaxOutputs * AxiomV2CircuitConstant.UserResultFieldElements + 
        AxiomV2CircuitConstant.UserMaxSubqueries * SUBQUERY_RESULT_LEN
      ],
      numChallenge: [0],
      isAggregation: false,
      numAdvicePerPhase: [config.numAdvice],
      numLookupAdvicePerPhase: [config.numLookupAdvice],
      numRlcColumns: 0,
      numFixed: 1,
      maxOutputs: AxiomV2CircuitConstant.UserMaxOutputs,
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
      this.provider,
    ).compile(this.f, inputs, this.inputSchema);
    this.timeEnd("Witness generation");
    this.config = config;
    this.results = results;
    await this.populateCircuit(inputs);
    await this.keygen();
    const vk = this.getHalo2Vk();
    const encoder = new TextEncoder();
    const inputSchema = encoder.encode(this.inputSchema);
    return {
      vk: byteArrayToBase64(vk),
      config,
      querySchema: this.getQuerySchema(),
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
    const onchainVkey = this.prependCircuitMetadata(this.config, vkBytes);
    
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

  buildMockComputeQuery() {
    // Mock compute query only works for the following DEFAULT_CIRCUIT_CONFIG:
    if (
      DEFAULT_CIRCUIT_CONFIG.k !== 14 ||
      DEFAULT_CIRCUIT_CONFIG.numAdvice !== 4 ||
      DEFAULT_CIRCUIT_CONFIG.numLookupAdvice !== 1 ||
      DEFAULT_CIRCUIT_CONFIG.numInstance !== 1 ||
      DEFAULT_CIRCUIT_CONFIG.numLookupBits !== 13 ||
      DEFAULT_CIRCUIT_CONFIG.numVirtualInstance !== 2
    ) {
      throw new Error(`MockComputeQuery not valid for this DEFAULT_CIRCUIT_CONFIG`);
    }
    const emptyVk = new Array(14).fill(zeroHash);
    const onchainVkey = this.prependCircuitMetadata(this.config, emptyVk);

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
    this.axiom = new AxiomSdkCore({
      providerUri: this.provider,
      chainId: this.chainId,
      mock,
      version: "v2",
    });
  }
}

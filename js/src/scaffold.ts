import { CircuitConfig, Halo2LibWasm } from "@axiom-crypto/halo2-wasm/web";
import { keccak256 } from "ethers";
import { convertToBytes, convertToBytes32, getRandom32Bytes } from "./utils";
import { encodePacked } from "viem";
import { AxiomCircuitRunner } from "./run";
import { AxiomV2Callback, AxiomV2ComputeQuery, DataSubquery } from "@axiom-crypto/tools";
import { Axiom, QueryBuilderV2, QueryV2 } from "@axiom-crypto/core";
import { BaseCircuitScaffold } from "@axiom-crypto/halo2-wasm/shared/scaffold";
import { DEFAULT_CIRCUIT_CONFIG } from "./constants";
import { RawInput } from "./types";
import { fromByteArray, toByteArray } from "base64-js";

export abstract class AxiomBaseCircuitScaffold<T> extends BaseCircuitScaffold {
    protected numInstances: number;
    protected halo2Lib!: Halo2LibWasm;
    protected provider: string;
    protected dataQuery: DataSubquery[];
    protected axiom: Axiom;
    protected computeQuery: AxiomV2ComputeQuery | undefined;
    protected chainId: string;
    protected f: (inputs: T) => Promise<void>;
    protected results: { [key: string]: string };

    constructor(inputs: {
        provider: string,
        f: (inputs: T) => Promise<void>,
        config?: CircuitConfig,
        mock?: boolean,
        chainId?: number | string | bigint,
        shouldTime?: boolean
    }) {
        super();
        this.numInstances = 0;
        this.provider = inputs.provider;
        this.config = inputs.config ?? DEFAULT_CIRCUIT_CONFIG;
        this.dataQuery = [];
        this.axiom = new Axiom({
            providerUri: inputs.provider,
            chainId: inputs.chainId,
            mock: inputs.mock,
            version: "v2"
        })
        this.chainId = inputs.chainId?.toString() ?? "5";
        this.shouldTime = inputs.shouldTime ?? false;
        this.loadedVk = false;
        this.f = inputs.f;
        this.results = {};
    }

    async loadSaved(input: { config: CircuitConfig, vk: string }) {
        this.config = input.config;
        await this.loadParamsAndVk(toByteArray(input.vk));
    }

    getQuerySchema() {
        const partialVk = this.getPartialVk();
        const vk = convertToBytes32(partialVk);
        const packed = encodePacked(["uint8", "uint16", "uint8", "bytes32[]"], [this.config.k, this.numInstances / 2, vk.length, vk]);
        const schema = keccak256(packed);
        return schema as string;
    }

    async compile(inputs: RawInput<T>) {
        this.newCircuitFromConfig(this.config);
        this.timeStart("Witness generation");
        const { config, results } = await AxiomCircuitRunner(this.halo2wasm, this.halo2Lib, this.config, this.provider).compile(this.f, inputs);
        this.timeEnd("Witness generation");
        this.config = config;
        this.results = results;
        await this.populateCircuit(inputs);
        await this.keygen();
        const vk = this.getHalo2Vk();
        return {
            vk: fromByteArray(vk),
            config,
            querySchema: this.getQuerySchema(),
        }
    }

    async populateCircuit(inputs: RawInput<T>) {
        this.newCircuitFromConfig(this.config);
        this.timeStart("Witness generation");
        const {
            numUserInstances,
            dataQuery } = await AxiomCircuitRunner(this.halo2wasm, this.halo2Lib, this.config, this.provider).run(this.f, inputs, this.results);
        this.timeEnd("Witness generation");
        this.numInstances = numUserInstances;
        this.dataQuery = dataQuery;
    }

    async run(inputs: RawInput<T>) {
        await this.populateCircuit(inputs);
        this.prove();
        const vk = this.getPartialVk();
        const vkBytes = convertToBytes32(vk);
        const computeProof = this.getComputeProof();
        const computeQuery: AxiomV2ComputeQuery = {
            k: this.config.k,
            vkey: vkBytes,
            computeProof: computeProof,
            resultLen: this.numInstances / 2,
        };
        this.computeQuery = computeQuery;
        return computeQuery;
    }

    async getSendQueryArgs(input: {
        callbackAddress: string,
        callbackExtraData: string,
        refundAddress: string,
    }) {
        if (!this.computeQuery) throw new Error("No compute query generated");
        const query = this.axiom.query as QueryV2;
        const axiomCallback: AxiomV2Callback = {
            target: input.callbackAddress,
            extraData: input.callbackExtraData
        };
        const qb: QueryBuilderV2 = query.new(undefined, this.computeQuery, axiomCallback);
        if (this.dataQuery.length > 0) {
            qb.setBuiltDataQuery({ subqueries: this.dataQuery, sourceChainId: this.chainId });
        }
        const {
            dataQueryHash,
            dataQuery,
            computeQuery,
            callback,
            maxFeePerGas,
            callbackGasLimit,
            sourceChainId,
        } = await qb.build();
        const payment = await qb.calculateFee();
        const salt = getRandom32Bytes();
        const abi = this.axiom.getAxiomQueryAbi();
        const axiomQueryAddress = this.axiom.getAxiomQueryAddress();
        const args = [sourceChainId, dataQueryHash, computeQuery, callback, salt, maxFeePerGas, callbackGasLimit, input.refundAddress, dataQuery]
        return {
            address: axiomQueryAddress as `0x${string}`,
            abi: abi,
            functionName: 'sendQuery',
            value: BigInt(payment),
            args
        };
    }

    getComputeProof() {
        if (!this.proof) throw new Error("No proof generated");
        let proofString = this.getComputeResults().map(r => r.slice(2)).join("");
        proofString += convertToBytes(this.proof);
        return "0x" + proofString;
    }

    getComputeResults() {
        if (!this.proof) throw new Error("No proof generated");
        const computeResults: string[] = [];
        const instances = this.getInstances();
        for (let i = 0; i < this.numInstances / 2; i++) {
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

}
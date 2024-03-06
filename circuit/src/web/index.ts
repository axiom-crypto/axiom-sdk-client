import { AxiomBaseCircuitScaffold } from "../scaffold";
import { CircuitConfig, getHalo2LibWasm, getHalo2Wasm, getKzgParams } from "@axiom-crypto/halo2-lib-js/wasm/web";
import { AxiomV2CircuitCapacity } from "../types";

export class AxiomBaseCircuit<T> extends AxiomBaseCircuitScaffold<T> {
    constructor(inputs: {
        provider: string,
        f: (inputs: T) => Promise<void>,
        inputSchema?: string,
        mock?: boolean,
        chainId?: number | string | bigint,
        shouldTime?: boolean,
        capacity?: AxiomV2CircuitCapacity,
        config?: CircuitConfig,
    }) {
        super(inputs);
        this.setContext({
            getKzgParams,
        });
    }

    async setup(numThreads: number) {
        this.halo2wasm = await getHalo2Wasm(numThreads);
        this.halo2wasm.config(this.config);
    }

    newCircuitFromConfig(config: CircuitConfig): void {
        super.newCircuitFromConfig(config);
        if (this.halo2Lib) this.halo2Lib.free();
        this.halo2Lib = getHalo2LibWasm(this.halo2wasm);
    }
}

export * from "../index";
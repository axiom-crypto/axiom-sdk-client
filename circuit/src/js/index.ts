import { CircuitConfig } from "@axiom-crypto/halo2-lib-js";
import { AxiomBaseCircuitScaffold } from "../scaffold";
import { getHalo2LibWasm, getHalo2Wasm, getKzgParams } from "@axiom-crypto/halo2-lib-js/wasm/js";
import { AxiomV2CircuitCapacity } from "../types";

export class AxiomBaseCircuit<T> extends AxiomBaseCircuitScaffold<T> {
    constructor(inputs: {
        rpcUrl: string,
        f: (inputs: T) => Promise<void>,
        inputSchema?: string,
        mock?: boolean,
        chainId?: number | string | bigint,
        shouldTime?: boolean,
        results?: { [key: string]: string },
        capacity?: AxiomV2CircuitCapacity,
        config?: CircuitConfig,
    }) {
        super(inputs);
        this.setContext({
            getKzgParams,
        });
        this.halo2wasm = getHalo2Wasm();
        this.halo2wasm.config(this.config);
    }

    async setup(_numThreads: number) {
        console.warn("Setup does nothing in JS AxiomBaseCircuit (multiple threads not supported)");
    }

    newCircuitFromConfig(config: CircuitConfig): void {
        super.newCircuitFromConfig(config);
        if (this.halo2Lib) this.halo2Lib.free();
        this.halo2Lib = getHalo2LibWasm(this.halo2wasm);
    }
}

export * from "../index";
import { CircuitConfig } from "@axiom-crypto/halo2-lib-js";
import { AxiomBaseCircuitScaffold } from "../scaffold";
import { getHalo2LibWasm, getHalo2Wasm } from "@axiom-crypto/halo2-wasm/js/";

export class AxiomCircuit<T> extends AxiomBaseCircuitScaffold<T> {
    constructor(inputs: {
        provider: string,
        f: (inputs: T) => Promise<void>,
        inputSchema: string,
        mock?: boolean,
        chainId?: number | string | bigint,
        shouldTime?: boolean
    }) {
        super(inputs);
        this.halo2wasm = getHalo2Wasm();
        this.halo2wasm.config(this.config);
    }

    newCircuitFromConfig(config: CircuitConfig): void {
        super.newCircuitFromConfig(config);
        if (this.halo2Lib) this.halo2Lib.free();
        this.halo2Lib = getHalo2LibWasm(this.halo2wasm);
    }
}
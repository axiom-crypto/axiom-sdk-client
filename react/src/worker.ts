import { AxiomCircuit as MyAxiomCircuit } from "@axiom-crypto/client/web";
import { expose } from "comlink";
import { AxiomV2CircuitCapacity } from "../../circuit/dist/types";

export class AxiomCircuit extends MyAxiomCircuit<any> {
    constructor(inputs: {
        provider: string,
        chainId: number | string | bigint,
        inputSchema?: string,
        shouldTime?: boolean,
        capacity?: AxiomV2CircuitCapacity,
        f: string,
    }) {
        const decodedArray = Buffer.from(inputs.f, 'base64');
        const decoder = new TextDecoder();
        const raw = decoder.decode(decodedArray);
        const AXIOM_CLIENT_IMPORT = require("@axiom-crypto/client");
        super({
            ...inputs,
            f: eval(raw),
        });
    }
}

expose(AxiomCircuit);
import { AxiomCircuit as MyAxiomCircuit } from "@axiom-crypto/client/web";
import { expose } from "comlink";

export class AxiomCircuit extends MyAxiomCircuit<any> {
    constructor(inputs: {
        provider: string,
        inputSchema?: string,
        mock?: boolean,
        chainId?: number | string | bigint,
        shouldTime?: boolean,
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
import { Halo2LibWasm, Halo2Wasm } from "@axiom-crypto/halo2-lib-js/wasm/web";
import { DataSubquery } from "@axiom-crypto/tools";
import { JsonRpcProvider } from "ethers";
declare global {
    namespace axiom {
        var dataQuery: DataSubquery[];
        var halo2lib: Halo2LibWasm;
        var halo2wasm: Halo2Wasm;
        var provider: JsonRpcProvider;
        var results: { [key: string]: string };
    }
}
import { CircuitValue, CircuitValue256, RawCircuitInput } from "@axiom-crypto/halo2-lib-js"
import { buildAccount } from "./account";
import { buildHeader } from "./header";
import { buildMapping } from "./mapping";
import { buildReceipt } from "./receipt";
import { buildStorage } from "./storage";
import { buildTx } from "./tx";
import { getCircuitValue256Witness } from "../utils";

/**
 * Retrieves the account information for a specific block and address.
 *
 * @param blockNumber - The block number.
 * @param address - The address of the account.
 * @returns An `Account` object to fetch individual account fields.
 */
const getAccount = (blockNumber: number | CircuitValue, address: string | CircuitValue) => {
    if (typeof address === "string") {
        address = new CircuitValue({ value: BigInt(address) });
    }
    if (typeof blockNumber === "number") {
        blockNumber = new CircuitValue({ value: BigInt(blockNumber) });
    }
    return buildAccount(blockNumber, address);
};

/**
 * Retrieves the receipt information for a specific transaction hash.
 *
 * @param blockNumber The block number
 * @param txIdx The transaction index in the block
 * @returns A `Receipt` object to fetch individual receipt fields.
 */
const getReceipt = (blockNumber: number | CircuitValue, txIdx: number | CircuitValue) => {
    if (typeof blockNumber === "number") {
        blockNumber = new CircuitValue({ value: BigInt(blockNumber) });
    }
    if (typeof txIdx === "number") {
        txIdx = new CircuitValue({ value: BigInt(txIdx) });
    }
    return buildReceipt(blockNumber, txIdx);
};

/**
 * Retrieves the storage information for a specific block and address.
 *
 * @param blockNumber The block number.
 * @param address The address of the contract.
 * @returns A `Storage` object to fetch individual storage slots.
 */
const getStorage = (blockNumber: number | CircuitValue, address: string | CircuitValue) => {
    if (typeof address === "string") {
        address = new CircuitValue({ value: BigInt(address) });
    }
    if (typeof blockNumber === "number") {
        blockNumber = new CircuitValue({ value: BigInt(blockNumber) });
    }
    return buildStorage(blockNumber, address);
};

/**
 * Retrieves the transaction information for a specific transaction hash.
 *
 * @param blockNumber The block number
 * @param txIdx The transaction index in the block
 * @returns A `Tx` object to fetch individual transaction fields.
 */
const getTx = (blockNumber: number | CircuitValue, txIdx: number | CircuitValue) => {
    if (typeof blockNumber === "number") {
        blockNumber = new CircuitValue({ value: BigInt(blockNumber) });
    }
    if (typeof txIdx === "number") {
        txIdx = new CircuitValue({ value: BigInt(txIdx) });
    }
    return buildTx(blockNumber, txIdx);
};

/**
 * Retrieves the header information for a specific block number.
 *
 * @param blockNumber - The block number.
 * @returns A `Header` object to fetch individual header fields.
 */
const getHeader = (blockNumber: number | CircuitValue) => {
    if (typeof blockNumber === "number") {
        blockNumber = new CircuitValue({ value: BigInt(blockNumber) });
    }
    return buildHeader(blockNumber)
}

/**
 * Retrieves the solidity mapping information for a specific block, address, and slot.
 *
 * @param blockNumber - The block number.
 * @param address - The address of the contract.
 * @param slot - The slot of the mapping.
 * @returns A `SolidityMapping` object to fetch individual mapping slots.
 */
const getSolidityMapping = (blockNumber: number | CircuitValue, address: string | CircuitValue, slot: number | bigint | string | CircuitValue256 | CircuitValue) => {
    if (typeof address === "string") {
        address = new CircuitValue({ value: BigInt(address) });
    }
    if (typeof blockNumber === "number") {
        blockNumber = new CircuitValue({ value: BigInt(blockNumber) });
    }
    if (typeof slot === "number" || typeof slot === "bigint" || typeof slot === "string") {
        slot = new CircuitValue256({ value: BigInt(slot) });
    }
    return buildMapping(blockNumber, address, slot);
}

/**
 * Adds a circuit value to the callback.
 *
 * @param a - The circuit value to add to the callback.
 */
const addToCallback = (a: CircuitValue | CircuitValue256) => {
    if (a instanceof CircuitValue) {
        const [hi, lo] = globalThis.axiom.halo2lib.to_hi_lo(a.cell());
        globalThis.axiom.halo2lib.make_public(globalThis.axiom.halo2wasm, hi, 0);
        globalThis.axiom.halo2lib.make_public(globalThis.axiom.halo2wasm, lo, 0);
    }
    else {
        globalThis.axiom.halo2lib.make_public(globalThis.axiom.halo2wasm, a.hi().cell(), 0);
        globalThis.axiom.halo2lib.make_public(globalThis.axiom.halo2wasm, a.lo().cell(), 0);
    }
}

/**
 * Creates a `CircuitValue256` from a hi-lo `CircuitValue` pair.
 *
 * @param hi The hi `CircuitValue`.
 * @param lo The lo `CircuitValue`.
 * @returns A `CircuitValue256` object
 */
const getCircuitValue256FromHiLo = (hi: CircuitValue, lo: CircuitValue) => {
    const circuitValue256 = new CircuitValue256({ hi, lo });
    return circuitValue256;
}

/**
 * Creates a `CircuitValue256` from a `RawCircuitInput`.
 *
 * @param a The raw circuit input.
 * @returns A `CircuitValue256` witness object
 */
const getCircuitValue256 = (a: RawCircuitInput) => {
    return getCircuitValue256Witness(a);
}

export {
    getAccount,
    getReceipt,
    getStorage,
    getTx,
    getHeader,
    getSolidityMapping,
    addToCallback,
    getCircuitValue256FromHiLo,
    getCircuitValue256,
}
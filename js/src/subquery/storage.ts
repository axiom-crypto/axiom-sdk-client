import { DataSubqueryType, StorageSubquery } from "@axiom-crypto/tools"
import { getCircuitValue256FromCircuitValue, getCircuitValue256Constant } from "../utils";
import { CircuitValue, RawCircuitInput, CircuitValue256 } from "@axiom-crypto/halo2-lib-js";
import { Halo2LibWasm } from "@axiom-crypto/halo2-lib-js/wasm/web";
import { prepData } from "./data";

/**
 * Represents the storage of a contract.
 */
export interface Storage {
  /**
   * Retrieves the value stored at a specific slot in the contract's storage.
   *
   * @param slot - The slot to retrieve the value from.
   * @returns A `CircuitValue` representing the value stored at the slot.
   */
  slot: (slot: RawCircuitInput | CircuitValue256 | CircuitValue) => Promise<CircuitValue256>;
}

export const buildStorage = (blockNumber: CircuitValue, addr: CircuitValue) => {

  const slot = (slot: RawCircuitInput | CircuitValue256 | CircuitValue) => {
    if (slot instanceof CircuitValue) {
      slot = getCircuitValue256FromCircuitValue(slot);
    }
    if (typeof slot === "string" || typeof slot === "number" || typeof slot == "bigint") {
      slot = getCircuitValue256Constant(slot);
    }

    let storageSubquery: StorageSubquery = {
      blockNumber: blockNumber.number(),
      addr: addr.address(),
      slot: slot.hex()
    }
    const dataSubquery = { subqueryData: storageSubquery, type: DataSubqueryType.Storage };
    return prepData(dataSubquery, [blockNumber, addr, slot.hi(), slot.lo()]);
  }

  const storage: Storage = { slot };

  return Object.freeze(storage)
}

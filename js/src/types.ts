import { CircuitValue, CircuitValue256 } from "@axiom-crypto/halo2-lib-js";

type ToRawInput<T> = T extends CircuitValue ? number | bigint | string :
    T extends CircuitValue[] ? (number | bigint | string)[] :
    T extends CircuitValue256 ? bigint | string :
    T extends CircuitValue256[] ? (bigint | string)[] :
    T;

export type RawInput<T> = {
    [P in keyof T]: ToRawInput<T[P]>;
};


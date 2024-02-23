import { CircuitConfig, CircuitValue, CircuitValue256 } from "@axiom-crypto/halo2-lib-js";

type ToRawInput<T> = T extends CircuitValue ? number | bigint | string :
    T extends CircuitValue[] ? (number | bigint | string)[] :
    T extends CircuitValue256 ? bigint | string :
    T extends CircuitValue256[] ? (bigint | string)[] :
    T;

export type RawInput<T> = {
    [P in keyof T]: ToRawInput<T[P]>;
};

export interface AxiomV2CircuitMetadataParams {
    version: number;
    numValuesPerInstanceColumn: number[];
    numChallenge: number[];
    isAggregation: boolean;
    numAdvicePerPhase: number[];
    numLookupAdvicePerPhase: number[];
    numRlcColumns: number;
    numFixed: number;
    maxOutputs: number;
};

export interface AxiomV2CircuitCapacity {
    maxOutputs: number;
    maxSubqueries: number;
}

export interface AxiomV2CircuitConfig extends CircuitConfig, AxiomV2CircuitCapacity { }


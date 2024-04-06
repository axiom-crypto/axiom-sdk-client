import type { ErrorType } from '../../errors/utils.js';
import type { Kzg } from '../../types/kzg.js';
import type { ByteArray, Hex } from '../../types/misc.js';
import { type HexToBytesErrorType } from '../encoding/toBytes.js';
import { type BytesToHexErrorType } from '../encoding/toHex.js';
type To = 'hex' | 'bytes';
export type blobsToProofsParameters<blobs extends ByteArray[] | Hex[], commitments extends ByteArray[] | Hex[], to extends To = (blobs extends Hex[] ? 'hex' : never) | (blobs extends ByteArray[] ? 'bytes' : never), _blobsType = (blobs extends Hex[] ? Hex[] : never) | (blobs extends ByteArray[] ? ByteArray[] : never)> = {
    /** Blobs to transform into proofs. */
    blobs: blobs;
    /** Commitments for the blobs. */
    commitments: commitments & (commitments extends _blobsType ? {} : `commitments must be the same type as blobs`);
    /** KZG implementation. */
    kzg: Pick<Kzg, 'computeBlobKzgProof'>;
    /** Return type. */
    to?: to | To | undefined;
};
export type blobsToProofsReturnType<to extends To> = (to extends 'bytes' ? ByteArray[] : never) | (to extends 'hex' ? Hex[] : never);
export type blobsToProofsErrorType = BytesToHexErrorType | HexToBytesErrorType | ErrorType;
/**
 * Compute the proofs for a list of blobs and their commitments.
 *
 * @example
 * ```ts
 * import {
 *   blobsToCommitments,
 *   toBlobs
 * } from 'viem'
 * import { kzg } from './kzg'
 *
 * const blobs = toBlobs({ data: '0x1234' })
 * const commitments = blobsToCommitments({ blobs, kzg })
 * const proofs = blobsToProofs({ blobs, commitments, kzg })
 * ```
 */
export declare function blobsToProofs<const blobs extends ByteArray[] | Hex[], const commitments extends ByteArray[] | Hex[], to extends To = (blobs extends Hex[] ? 'hex' : never) | (blobs extends ByteArray[] ? 'bytes' : never)>(parameters: blobsToProofsParameters<blobs, commitments, to>): blobsToProofsReturnType<to>;
export {};
//# sourceMappingURL=blobsToProofs.d.ts.map
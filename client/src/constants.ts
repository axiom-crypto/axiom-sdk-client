import { ChainDefaults } from "./types";

export const ClientConstants = Object.freeze({
  MIN_MAX_FEE_PER_GAS: 5000000000n,
  AXIOM_PROOF_CALLDATA_LEN: 2875, // bytes
  AXIOM_PROOF_CALLDATA_BYTES: "0x" + "11".repeat(2875),
})

export const MainnetDefaults: Readonly<ChainDefaults> = Object.freeze({
  maxFeePerGasWei: 25000000000n,
  callbackGasLimit: 100000n,
  proofVerificationGas: 420000n,
  axiomQueryFeeWei: 3000000000000000n,
});

export const BaseDefaults: Readonly<ChainDefaults> = Object.freeze({
  maxFeePerGasWei: 25000000000n,
  callbackGasLimit: 100000n,
  proofVerificationGas: 420000n,
  axiomQueryFeeWei: 3000000000000000n,
});
import { ChainDefaults } from "./types";

export const ClientConstants = Object.freeze({
  AXIOM_PROOF_CALLDATA_LEN: 2875, // bytes
  AXIOM_PROOF_CALLDATA_BYTES: "0x" + "11".repeat(2875),
  L1_FEE_NUMERATOR: 120n, // (1.2x multiplier)
  L1_FEE_DENOMINATOR: 100n,
})

export const MainnetDefaults: Readonly<ChainDefaults> = Object.freeze({
  maxFeePerGasWei: 25000000000n,
  minMaxFeePerGasWei: 5000000000n,
  callbackGasLimit: 100000n,
  proofVerificationGas: 420000n,
  axiomQueryFeeWei: 3000000000000000n,
});

export const BaseDefaults: Readonly<ChainDefaults> = Object.freeze({
  maxFeePerGasWei: 750000000n,
  minMaxFeePerGasWei: 250000000n,
  callbackGasLimit: 100000n,
  proofVerificationGas: 420000n,
  axiomQueryFeeWei: 3000000000000000n,
});

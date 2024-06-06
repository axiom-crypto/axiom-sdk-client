import { PublicClient, concat, numberToHex } from "viem";
import { getChainDefaults } from "../../../../src/lib/chain";
import { ClientConstants } from "../../../../src/lib/constants";
import {
  getOpStackGasPriceOracleAbi,
  getOpStackGasPriceOracleAddress,
  getOpStackL1BlockAttributesAbi,
  getOpStackL1BlockAttributesAddress,
} from "../../../../src";

/**
 * 
 */
export const calculateOpStackCallbackCost = async (
  publicClient: PublicClient,
  baseFee: bigint,
  baseFeeScalar: bigint,
  blobBaseFee: bigint,
  blobBaseFeeScalar: bigint,
  maxFeePerGas: bigint,
  callbackGasLimit: bigint,
  proofVerificationGas: bigint,
) => {
  const l2ExecutionCost = maxFeePerGas * (callbackGasLimit + proofVerificationGas);

  // https://github.com/ethereum-optimism/optimism/blob/develop/packages/contracts-bedrock/src/L2/L1Block.sol#L25-L58
  //                              ATTRIBUTES STORAGE LAYOUT
  // 
  // sN = sequenceNumber
  // bBFS = blobBaseFeeScalar
  // bFS = baseFeeScalar
  //
  //      |       256       |        196        |        128         |         64         |
  // 0x00 |                 |                   |     timestamp      |       number       |
  // 0x01 |                                  baseFee                                      |
  // 0x02 |                                   hash                                        |
  // 0x03 |                                     |   bFS   |   bBFS   |         sN         |
  // 0x04 |                                batcherHash                                    |
  // 0x05 |                               l1FeeOverhead                                   |
  // 0x06 |                                l1FeeScalar                                    |
  // 0x07 |                                blobBaseFee                                    |

  // Overrides the relevant storage slots in the L1BlockAttributes contract
  const l1DataCost = await publicClient.readContract({
    address: getOpStackGasPriceOracleAddress() as `0x${string}`,
    abi: getOpStackGasPriceOracleAbi(),
    functionName: "getL1Fee",
    args: [ClientConstants.AXIOM_PROOF_CALLDATA_BYTES],
    // Fix block number to Fjord activation
    blockNumber: 10615056n,
    stateOverride: [
      {
        address: getOpStackL1BlockAttributesAddress() as `0x${string}`,
        stateDiff: [
          // baseFee
          {
            slot: "0x0000000000000000000000000000000000000000000000000000000000000001",
            value: numberToHex(baseFee, { size: 32 })
          },
          // baseFeeScalar and blobBaseFeeScalar
          {
            slot: "0x0000000000000000000000000000000000000000000000000000000000000003",
            value: concat([
              numberToHex(0n, { size: 16 }),
              numberToHex(baseFeeScalar, { size: 4 }), 
              numberToHex(blobBaseFeeScalar, { size: 4 }), 
              // sequenceNumber can be zeroed since it's not used
              numberToHex(0n, { size: 8 }),
            ]),
          },
          // blobBaseFee
          {
            slot: "0x0000000000000000000000000000000000000000000000000000000000000007",
            value: numberToHex(blobBaseFee, { size: 32 })
          }
        ]
      }
    ]
  }) as bigint;

  const paddedL1DataCost = l1DataCost * ClientConstants.L1_FEE_NUMERATOR / ClientConstants.L1_FEE_DENOMINATOR;

  return paddedL1DataCost + l2ExecutionCost;
};

export const calculateQueryCost = async (
  publicClient: PublicClient,
  chainId: string,
  basefee: bigint,
  baseFeeScalar: bigint,
  blobBaseFee: bigint,
  blobBaseFeeScalar: bigint,
  maxFeePerGas: bigint,
  callbackGasLimit: bigint,
  proofVerificationGas: bigint,
): Promise<bigint> => {
  const sdkMinMaxFeePerGas = getChainDefaults(chainId).minMaxFeePerGasWei;
  if (maxFeePerGas < sdkMinMaxFeePerGas) {
    maxFeePerGas = sdkMinMaxFeePerGas;
  }
  const projectedCallbackCost = await calculateOpStackCallbackCost(
    publicClient,
    basefee,
    baseFeeScalar,
    blobBaseFee,
    blobBaseFeeScalar,
    maxFeePerGas,
    callbackGasLimit,
    proofVerificationGas,
  );
  const overrideAxiomQueryFee =
    getChainDefaults(chainId).axiomQueryFeeWei +
    projectedCallbackCost -
    maxFeePerGas * (callbackGasLimit + proofVerificationGas);
  const queryCost =
    overrideAxiomQueryFee + maxFeePerGas * (callbackGasLimit + proofVerificationGas);
  return queryCost;
};

export const percentDiffX100 = (a: bigint, b: bigint): bigint => {
  let percentDiff = ((a - b) * 10000n) / a;
  if (percentDiff < 0) {
    percentDiff = -percentDiff;
  }
  return percentDiff;
};

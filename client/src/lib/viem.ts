import { Chain, PublicClient } from "viem";

// Creates a generic viem Chain object that uses a specified chainId and provider
// Can use `chainProperties` to override any field.
export const viemChain = (
  chainId: string, 
  provider: string,
  chainProperties?: object
): Chain => {
  let chain = {
    id: Number(chainId),
    name: `Chain ${chainId}`,
    nativeCurrency: {
      name: "Ether",
      symbol: "ETH",
      decimals: 18,
    },
    rpcUrls: {
      default: {
        http: [provider],
      },
    },
  } as const satisfies Chain
  chain = {
    ...chain,
    ...chainProperties,
  }
  return chain;
}

export const readContractValueBigInt = async (
  publicClient: PublicClient,
  address: string,
  abi: any[],
  functionName: string,
  args: any[],
  fallback?: bigint,
): Promise<bigint> => {
  let value;
  try {
    value = BigInt(await publicClient.readContract({
      address: address as `0x${string}`,
      abi,
      functionName,
      args,
    }));
  } catch (e: any) {
    console.log(`Unable to read ${functionName} from contract ${address}`);
  }
  value = BigInt(value ?? 0);
  if (fallback !== undefined && value === 0n) {
    value = fallback;
  }
  return value;
}
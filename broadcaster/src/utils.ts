import { Chain } from "viem"

// Creates a generic viem Chain object that uses a specified chainId and provider
// Can use `chainProperties` to override any field.
export const createChain = (
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
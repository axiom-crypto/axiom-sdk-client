import { 
  createPublicClient,
  createWalletClient,
  http,
  Chain,
  TransactionReceipt,
} from "viem"
import { privateKeyToAccount } from 'viem/accounts';
import { getAxiomV2Abi, AbiType } from "@axiom-crypto/client";
import { AxiomV2BroadcastClientParams } from "./types";
import { getAxiomV2BroadcasterAddress } from "./lib/address";

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

export const viemPublicClient = (chainId: string, provider: string) => {
  return createPublicClient({
    chain: viemChain(chainId, provider),
    transport: http(provider),
  });
}

export const viemWalletClient = (chainId: string, provider: string, privateKey: string) => {
  return createWalletClient({
    chain: viemChain(chainId, provider),
    account: privateKeyToAccount(privateKey as `0x${string}`),
    transport: http(provider),
  });
}

export const broadcasterWrite = async (
  clientParams: AxiomV2BroadcastClientParams,
  input: {
    functionName: string,
    args: any[],
  },
): Promise<TransactionReceipt> => {
  if (!clientParams.walletClient) {
    throw new Error(`Wallet client for ${clientParams.chainId} is required for this operation`);
  }
  const axiomV2Broadcaster = getAxiomV2BroadcasterAddress(clientParams.chainId);
  const { request } = await clientParams.publicClient.simulateContract({
    account: clientParams.walletClient.account,
    address: axiomV2Broadcaster,
    abi: getAxiomV2Abi(AbiType.Broadcaster),
    functionName: input.functionName,
    args: input.args,
  });
  const hash = await clientParams.walletClient.writeContract(request);
  if (!hash) {
    throw new Error(`Contract call to ${axiomV2Broadcaster} failed: ${input.functionName}`);
  }
  return await clientParams.publicClient.waitForTransactionReceipt({ hash });
}

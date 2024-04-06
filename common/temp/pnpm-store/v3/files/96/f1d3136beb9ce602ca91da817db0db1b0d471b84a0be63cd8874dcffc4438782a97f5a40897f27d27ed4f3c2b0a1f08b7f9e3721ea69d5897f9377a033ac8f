/**
 * Extract capabilities that a connected wallet supports (e.g. paymasters, session keys, etc).
 *
 * - Docs: https://viem.sh/experimental/actions/getCapabilities
 * - JSON-RPC Methods: [`wallet_getCapabilities`](https://eips.ethereum.org/EIPS/eip-5792)
 *
 * @param client - Client to use
 * @returns The wallet's capabilities. {@link GetCapabilitiesReturnType}
 *
 * @example
 * import { createWalletClient, custom } from 'viem'
 * import { mainnet } from 'viem/chains'
 * import { getCapabilities } from 'viem/wallet'
 *
 * const client = createWalletClient({
 *   chain: mainnet,
 *   transport: custom(window.ethereum),
 * })
 * const capabilities = await getCapabilities(client)
 */
export async function getCapabilities(client) {
    const capabilities_raw = await client.request({
        method: 'wallet_getCapabilities',
    });
    const capabilities = {};
    for (const [key, value] of Object.entries(capabilities_raw))
        capabilities[Number(key)] = value;
    return capabilities;
}
//# sourceMappingURL=getCapabilities.js.map
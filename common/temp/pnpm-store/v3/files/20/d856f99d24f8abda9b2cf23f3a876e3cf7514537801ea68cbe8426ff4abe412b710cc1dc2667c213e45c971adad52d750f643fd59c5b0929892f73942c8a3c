import { hexToBigInt } from '../../utils/encoding/fromHex.js';
import { receiptStatuses } from '../../utils/formatters/transactionReceipt.js';
/**
 * Returns the status of a call batch that was sent via `sendCalls`.
 *
 * - Docs: https://viem.sh/experimental/actions/getCallsReceipt
 * - JSON-RPC Methods: [`wallet_getCallsReceipt`](https://eips.ethereum.org/EIPS/eip-5792)
 *
 * @param client - Client to use
 * @returns Status of the calls. {@link GetCallsReceiptReturnType}
 *
 * @example
 * import { createWalletClient, custom } from 'viem'
 * import { mainnet } from 'viem/chains'
 * import { getCallsReceipt } from 'viem/wallet'
 *
 * const client = createWalletClient({
 *   chain: mainnet,
 *   transport: custom(window.ethereum),
 * })
 * const { receipts, status } = await getCallsReceipt(client, { id: '0xdeadbeef' })
 */
export async function getCallsReceipt(client, parameters) {
    const { id } = parameters;
    const { receipts, status } = await client.request({
        method: 'wallet_getCallsReceipt',
        params: id,
    });
    return {
        status,
        receipts: receipts?.map((receipt) => ({
            ...receipt,
            blockNumber: hexToBigInt(receipt.blockNumber),
            gasUsed: hexToBigInt(receipt.gasUsed),
            status: receiptStatuses[receipt.status],
        })) ?? [],
    };
}
//# sourceMappingURL=getCallsReceipt.js.map
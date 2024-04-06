import { parseAccount, } from '../../accounts/utils/parseAccount.js';
import { internal_estimateFeesPerGas, } from '../../actions/public/estimateFeesPerGas.js';
import { estimateGas, } from '../../actions/public/estimateGas.js';
import { getBlock, } from '../../actions/public/getBlock.js';
import { getTransactionCount, } from '../../actions/public/getTransactionCount.js';
import {} from '../../errors/account.js';
import { Eip1559FeesNotSupportedError, MaxFeePerGasTooLowError, } from '../../errors/fee.js';
import { getAction } from '../../utils/getAction.js';
import { assertRequest } from '../../utils/transaction/assertRequest.js';
import { getTransactionType } from '../../utils/transaction/getTransactionType.js';
import { getChainId } from '../public/getChainId.js';
/**
 * Prepares a transaction request for signing.
 *
 * - Docs: https://viem.sh/docs/actions/wallet/prepareTransactionRequest
 *
 * @param args - {@link PrepareTransactionRequestParameters}
 * @returns The transaction request. {@link PrepareTransactionRequestReturnType}
 *
 * @example
 * import { createWalletClient, custom } from 'viem'
 * import { mainnet } from 'viem/chains'
 * import { prepareTransactionRequest } from 'viem/actions'
 *
 * const client = createWalletClient({
 *   chain: mainnet,
 *   transport: custom(window.ethereum),
 * })
 * const request = await prepareTransactionRequest(client, {
 *   account: '0xA0Cf798816D4b9b9866b5330EEa46a18382f251e',
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: 1n,
 * })
 *
 * @example
 * // Account Hoisting
 * import { createWalletClient, http } from 'viem'
 * import { privateKeyToAccount } from 'viem/accounts'
 * import { mainnet } from 'viem/chains'
 * import { prepareTransactionRequest } from 'viem/actions'
 *
 * const client = createWalletClient({
 *   account: privateKeyToAccount('0x…'),
 *   chain: mainnet,
 *   transport: custom(window.ethereum),
 * })
 * const request = await prepareTransactionRequest(client, {
 *   to: '0x0000000000000000000000000000000000000000',
 *   value: 1n,
 * })
 */
export async function prepareTransactionRequest(client, args) {
    const { account: account_ = client.account, chain, chainId, gas, nonce, parameters = ['chainId', 'fees', 'gas', 'nonce', 'type'], type, } = args;
    const account = account_ ? parseAccount(account_) : undefined;
    const request = { ...args, ...(account ? { from: account?.address } : {}) };
    if (parameters.includes('chainId')) {
        if (chain)
            request.chainId = chain.id;
        else if (typeof chainId !== 'undefined')
            request.chainId = chainId;
        else
            request.chainId = await getAction(client, getChainId, 'getChainId')({});
    }
    if (parameters.includes('nonce') && typeof nonce === 'undefined' && account)
        request.nonce = await getAction(client, getTransactionCount, 'getTransactionCount')({
            address: account.address,
            blockTag: 'pending',
        });
    const block = await (() => {
        if (typeof request.type !== 'undefined')
            return;
        return getAction(client, getBlock, 'getBlock')({ blockTag: 'latest' });
    })();
    if ((parameters.includes('fees') || parameters.includes('type')) &&
        typeof type === 'undefined') {
        try {
            request.type = getTransactionType(request);
        }
        catch {
            // infer type from block
            request.type =
                typeof block?.baseFeePerGas === 'bigint' ? 'eip1559' : 'legacy';
        }
    }
    if (parameters.includes('fees')) {
        // TODO(4844): derive blob base fees once https://github.com/ethereum/execution-apis/pull/486 is merged.
        if (request.type === 'eip1559' || request.type === 'eip4844') {
            // EIP-1559 fees
            if (typeof request.maxFeePerGas === 'undefined' ||
                typeof request.maxPriorityFeePerGas === 'undefined') {
                const { maxFeePerGas, maxPriorityFeePerGas } = await internal_estimateFeesPerGas(client, {
                    block: block,
                    chain,
                    request: request,
                });
                if (typeof args.maxPriorityFeePerGas === 'undefined' &&
                    args.maxFeePerGas &&
                    args.maxFeePerGas < maxPriorityFeePerGas)
                    throw new MaxFeePerGasTooLowError({
                        maxPriorityFeePerGas,
                    });
                request.maxPriorityFeePerGas = maxPriorityFeePerGas;
                request.maxFeePerGas = maxFeePerGas;
            }
        }
        else {
            // Legacy fees
            if (typeof args.maxFeePerGas !== 'undefined' ||
                typeof args.maxPriorityFeePerGas !== 'undefined')
                throw new Eip1559FeesNotSupportedError();
            const { gasPrice: gasPrice_ } = await internal_estimateFeesPerGas(client, {
                block: block,
                chain,
                request: request,
                type: 'legacy',
            });
            request.gasPrice = gasPrice_;
        }
    }
    if (parameters.includes('gas') && typeof gas === 'undefined')
        request.gas = await getAction(client, estimateGas, 'estimateGas')({
            ...request,
            account: account
                ? { address: account.address, type: 'json-rpc' }
                : undefined,
        });
    assertRequest(request);
    delete request.parameters;
    return request;
}
//# sourceMappingURL=prepareTransactionRequest.js.map
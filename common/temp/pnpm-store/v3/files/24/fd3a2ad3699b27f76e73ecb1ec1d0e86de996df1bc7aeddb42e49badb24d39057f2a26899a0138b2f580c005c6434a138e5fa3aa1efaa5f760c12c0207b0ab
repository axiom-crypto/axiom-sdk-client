import { LruMap } from '../lru.js';
import { checksumAddress } from './getAddress.js';
const addressRegex = /^0x[a-fA-F0-9]{40}$/;
export const isAddressCache = /*#__PURE__*/ new LruMap(8192);
export function isAddress(address, options) {
    const { strict = true } = options ?? {};
    if (isAddressCache.has(address))
        return isAddressCache.get(address);
    const result = (() => {
        if (!addressRegex.test(address))
            return false;
        if (address.toLowerCase() === address)
            return true;
        if (strict)
            return checksumAddress(address) === address;
        return true;
    })();
    isAddressCache.set(address, result);
    return result;
}
//# sourceMappingURL=isAddress.js.map
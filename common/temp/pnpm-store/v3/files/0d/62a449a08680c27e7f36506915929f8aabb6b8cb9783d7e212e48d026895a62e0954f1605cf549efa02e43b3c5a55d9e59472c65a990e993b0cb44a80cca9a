"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAddress = exports.isAddressCache = void 0;
const lru_js_1 = require("../lru.js");
const getAddress_js_1 = require("./getAddress.js");
const addressRegex = /^0x[a-fA-F0-9]{40}$/;
exports.isAddressCache = new lru_js_1.LruMap(8192);
function isAddress(address, options) {
    const { strict = true } = options ?? {};
    if (exports.isAddressCache.has(address))
        return exports.isAddressCache.get(address);
    const result = (() => {
        if (!addressRegex.test(address))
            return false;
        if (address.toLowerCase() === address)
            return true;
        if (strict)
            return (0, getAddress_js_1.checksumAddress)(address) === address;
        return true;
    })();
    exports.isAddressCache.set(address, result);
    return result;
}
exports.isAddress = isAddress;
//# sourceMappingURL=isAddress.js.map
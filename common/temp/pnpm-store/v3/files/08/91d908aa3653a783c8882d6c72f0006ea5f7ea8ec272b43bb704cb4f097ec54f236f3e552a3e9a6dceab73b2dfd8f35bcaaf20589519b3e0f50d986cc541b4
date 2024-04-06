"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCapabilities = void 0;
async function getCapabilities(client) {
    const capabilities_raw = await client.request({
        method: 'wallet_getCapabilities',
    });
    const capabilities = {};
    for (const [key, value] of Object.entries(capabilities_raw))
        capabilities[Number(key)] = value;
    return capabilities;
}
exports.getCapabilities = getCapabilities;
//# sourceMappingURL=getCapabilities.js.map
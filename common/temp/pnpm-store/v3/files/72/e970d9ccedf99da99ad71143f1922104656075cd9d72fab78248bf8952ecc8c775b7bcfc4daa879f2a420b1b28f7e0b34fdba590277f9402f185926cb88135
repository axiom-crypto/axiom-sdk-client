"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signatureToHex = void 0;
const secp256k1_1 = require("@noble/curves/secp256k1");
const fromHex_js_1 = require("../../utils/encoding/fromHex.js");
function signatureToHex({ r, s, v, yParity }) {
    const vHex = (() => {
        if (v === 27n || yParity === 0)
            return '1b';
        if (v === 28n || yParity === 1)
            return '1c';
        throw new Error('Invalid v value');
    })();
    return `0x${new secp256k1_1.secp256k1.Signature((0, fromHex_js_1.hexToBigInt)(r), (0, fromHex_js_1.hexToBigInt)(s)).toCompactHex()}${vHex}`;
}
exports.signatureToHex = signatureToHex;
//# sourceMappingURL=signatureToHex.js.map
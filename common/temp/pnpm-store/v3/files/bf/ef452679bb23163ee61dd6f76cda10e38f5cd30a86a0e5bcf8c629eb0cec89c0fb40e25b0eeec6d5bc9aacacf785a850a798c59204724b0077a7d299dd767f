"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.signatureToCompactSignature = void 0;
const index_js_1 = require("../index.js");
function signatureToCompactSignature(signature) {
    const { r, s, v, yParity } = signature;
    const yParity_ = Number(yParity ?? v - 27n);
    let yParityAndS = s;
    if (yParity_ === 1) {
        const bytes = (0, index_js_1.hexToBytes)(s);
        bytes[0] |= 0x80;
        yParityAndS = (0, index_js_1.bytesToHex)(bytes);
    }
    return { r, yParityAndS };
}
exports.signatureToCompactSignature = signatureToCompactSignature;
//# sourceMappingURL=signatureToCompactSignature.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.recoverTransactionAddress = void 0;
const keccak256_js_1 = require("../hash/keccak256.js");
const parseTransaction_js_1 = require("../transaction/parseTransaction.js");
const serializeTransaction_js_1 = require("../transaction/serializeTransaction.js");
const recoverAddress_js_1 = require("./recoverAddress.js");
const signatureToHex_js_1 = require("./signatureToHex.js");
async function recoverTransactionAddress(parameters) {
    const { serializedTransaction, signature: signature_ } = parameters;
    const transaction = (0, parseTransaction_js_1.parseTransaction)(serializedTransaction);
    const signature = signature_ ??
        (0, signatureToHex_js_1.signatureToHex)({
            r: transaction.r,
            s: transaction.s,
            v: transaction.v,
            yParity: transaction.yParity,
        });
    const serialized = (0, serializeTransaction_js_1.serializeTransaction)({
        ...transaction,
        r: undefined,
        s: undefined,
        v: undefined,
        yParity: undefined,
    });
    return await (0, recoverAddress_js_1.recoverAddress)({
        hash: (0, keccak256_js_1.keccak256)(serialized),
        signature,
    });
}
exports.recoverTransactionAddress = recoverTransactionAddress;
//# sourceMappingURL=recoverTransactionAddress.js.map
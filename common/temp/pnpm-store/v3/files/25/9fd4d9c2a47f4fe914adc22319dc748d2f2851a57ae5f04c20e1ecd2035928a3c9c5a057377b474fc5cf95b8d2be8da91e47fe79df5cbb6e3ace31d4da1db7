"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.walletActionsEip5792 = void 0;
const getCallsReceipt_js_1 = require("../actions/getCallsReceipt.js");
const getCapabilities_js_1 = require("../actions/getCapabilities.js");
const sendCalls_js_1 = require("../actions/sendCalls.js");
const writeContracts_js_1 = require("../actions/writeContracts.js");
function walletActionsEip5792() {
    return (client) => {
        return {
            getCallsReceipt: (parameters) => (0, getCallsReceipt_js_1.getCallsReceipt)(client, parameters),
            getCapabilities: () => (0, getCapabilities_js_1.getCapabilities)(client),
            sendCalls: (parameters) => (0, sendCalls_js_1.sendCalls)(client, parameters),
            writeContracts: (parameters) => (0, writeContracts_js_1.writeContracts)(client, parameters),
        };
    };
}
exports.walletActionsEip5792 = walletActionsEip5792;
//# sourceMappingURL=eip5792.js.map
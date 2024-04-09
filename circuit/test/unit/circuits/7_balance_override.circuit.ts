import {
    CircuitValue,
    CircuitValue256,
    getAccount,
    addToCallback,
    add,
    or,
} from "../../../dist";

export const inputs = {
    address: "0x897dDbe14c9C7736EbfDC58461355697FbF70048",
    claimedBlockNumber: 5000000,
};
export type CircuitInputType = typeof inputs;
export interface CircuitInputs extends CircuitInputType { }
export interface CircuitValueInputs {
    address: CircuitValue;
    claimedBlockNumber: CircuitValue;
}
export const circuit = async ({
    address,
    claimedBlockNumber,
}: CircuitValueInputs) => {

    for (let i = 0; i < 200; i++) {
        const acct = getAccount(claimedBlockNumber, address);
        const balance = await acct.balance();
        addToCallback(balance);
    }

};
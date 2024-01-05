import {
CircuitValue,
CircuitValue256,
getAccount,
addToCallback,
add,
or,
} from "@axiom-crypto/client";

export const inputs = {
  "blockNumber": 5000000,
  "accounts": [
    "0x45A318273749d6eb00f5F6cA3bC7cD3De26D642A",
    "0xcEbf6C32533291322bf57FEced73a755FDb87494",
    "0xd20BDECF96871ad354A6Cc7741C3AD65eaD738CB",
    "0x03f2901Db5723639978deBed3aBA66d4EA03aF73",
    "0x9D8876F9b7B97b287561e6263FC8ddCD616F9E2F",
    "0x5f4A0588d91De64a046dE7F6892739D5D98258C2",
    "0x45f1A95D617B5f90c601E52cB244aCBB750Ec450",
    "0x5293Bb897db0B64FFd11E0194984E8c5F1f06178"
  ]
};
export type CircuitInputType = typeof inputs;
export interface CircuitInputs extends CircuitInputType { }
export interface CircuitValueInputs {
  blockNumber: CircuitValue;
  accounts: CircuitValue[];
}
export const circuit = async ({
  blockNumber,
  accounts,
}: CircuitValueInputs) => {

  for (let i = 0; i < 7; i++) {
    const acct = getAccount(blockNumber, accounts[i]);
    addToCallback(await acct.balance());
  }
  
  
};
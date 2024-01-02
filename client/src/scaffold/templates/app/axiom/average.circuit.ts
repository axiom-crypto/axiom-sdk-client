import {
  add,
  sum,
  div,
  addToCallback,
  CircuitValue,
  CircuitValue256,
  constant,
  getAccount,
} from "@axiom-crypto/client";

/// For type safety, define the input types to your circuit here.
/// These should be the _variable_ inputs to your circuit. Constants can be hard-coded into the circuit itself.
export interface CircuitInputs {
  blockNumber: CircuitValue;
  address: CircuitValue;
}

export const average = async ({
  blockNumber,
  address,
}: CircuitInputs) => {
  // Since the blockNumber is a variable input, let's add it to the results that will be sent to our callback function:
  addToCallback(blockNumber);
  addToCallback(address);

  // number of samples
  const samples = 10; 

  // number of blocks between each sample
  const spacing = 100;

  // We add a subquery for the account nonce. Note you need to `await`!
  const blockNumbers = Array.from({length: samples}, (_: any, i: number) => blockNumber - (spacing * i));
  const balances = await Promise.all(
    blockNumbers.map(
      async (sampleBlockNum: number) => await getAccount(sampleBlockNum, address).balance()
    )
  );
  const total = sum(balances);
  const average = div(total, samples);

  // We add the result to the callback
  addToCallback(average);
};

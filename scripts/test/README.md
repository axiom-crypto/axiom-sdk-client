# Integration test generation scripts

## Getting chain data for integration tests

We have a script that reads blockchain data and puts it into a format that can be used by the test input generator script. The script at `/scripts/test/findTestData.ts` will find chain data and output a formatted json file for this data. It will use the environment variable `PROVIDER_URI` to determine the chainId automatically.

You may need to deploy and run a contract that will send multiple transactions of the correct size in order to get the correct transaction and receipt size categories. This is located in `/scripts/test/solidity_sized_tx_contract`. You can have it deploy the contract and create transactions with the correct transaction data by running the following from the root of the repository.

```bash
pnpm deploy-test-inputs
```

You'll want to note which block number these transactions were sent in. Update the `INCLUDE_BLOCKS` constant in `findTestData.ts` to include the block number(s) from the transactions.

## Generating test inputs

Update the CHAIN_ID value in `/scripts/test/generateTestInputs.ts` to match your desired chain ID and then run from the root of the repository.

```bash
pnpm generate-test-inputs
```
# axiom-client harness

Client harness that allows for easy circuit parameter generation and testing. Uses standard Axiom `*.circuit.ts` files.

## Integration test data generation scripts

### Getting chain data for integration tests

We have a script that reads blockchain data and puts it into a format that can be used by the test input generator script. The script at `/scripts/test/findTestData.ts` will find chain data and output a formatted json file for this data. It will use the environment variable `PROVIDER_URI` to determine the chainId automatically.

You may need to deploy and run a contract that will send multiple transactions of the correct size in order to get the correct transaction and receipt size categories. This is located in `/scripts/test/solidity_sized_tx_contract`. You can have it deploy the contract and create transactions with the correct transaction data by running the following from the root of the repository.

```bash
pnpm deploy-test-inputs
```

You'll want to note which block number these transactions were sent in. Update the `INCLUDE_BLOCKS` constant in `findTestData.ts` to include the block number(s) from the transactions.

### Generating test inputs

We have a Solidity contract that can be deployed to generate transaction and receipt data of a particular size. Set `PROVIDER_URI` and `PRIVATE_KEY` to the provider and account private key of the chain that you would like to deploy on.

```bash
pnpm deploy:inputs
```

Record the block number that the transactions occrred in. You can then edit the command in `test/search_chaindata.sh` to use the above deployed block number for `--include <blockNumber>` to add those specific transactions/receipts to the chain data search.

## Setting test inputs

Test inputs can be set by adding a `//$` decorator followed by the chaindata object path to each input.

```javascript
blockNumber: 4000000, //$ account.eoa[8].blockNumber
```

## Running integration tests

Prefix a `CHAIN_ID` environmental variable before running your test. Ensure that `PROVIDER_URI_${CHAIN_ID}` and `PRIVATE_KEY_${CHAIN_ID}` exist in `.env` before running.

```bash
CHAIN_ID=11155111 pnpm jest test/integration/start.test.ts
```

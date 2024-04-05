# Client SDK Integration Tests

## Running tests

`chainId` argument is required to run the test:

```bash
pnpm jest test/integration -- --chainId=11155111
```

## Creating integration tests

### Getting chain data for integration tests

We have a script that reads blockchain data and puts it into a format that can be used by the test input generator script. The script at `/scripts/test/findTestData.ts` will find chain data and output a formatted json file for this data. It will use the environment variable `PROVIDER_URI` to determine the chainId automatically.

You may need to deploy and run a contract that will send multiple transactions of the correct size in order to get the correct transaction and receipt size categories. This is located in `/scripts/test/solidity_sized_tx_contract`. You can have it deploy the contract and create transactions with the correct transaction data by running the following from the root of the repository.

```bash
pnpm deploy-inputs
```

```bash
pnpm generate-test-inputs
```

Integration tests will call the `generateCircuit` helper function that takes in a relative path to the circuit. The input path is generated from the chainId.

**NOTE:** Imports in the integration tests use `@axiom-crypto/circuit` instead of `@axiom-crypto/client`.

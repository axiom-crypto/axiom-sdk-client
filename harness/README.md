# axiom-client harness

Client harness that allows for easy circuit parameter generation and testing. Uses standard Axiom `*.circuit.ts` files.

## Integration test data generation scripts

### Generating test inputs

We have a Solidity contract that can be deployed to generate transaction and receipt data of a particular size. Set `RPC_URL` and `PRIVATE_KEY` to the provider and account private key of the chain that you would like to deploy on.

```bash
pnpm deploy:inputs
```

Record the block number that the transactions occrred in. You can add them to a comma-separated list of block numbers in the harness search command below.

### Getting chain data for integration tests

To run the chain data search script:

```bash
# When importing harness as a package
npx harness search --provider <RPC_URL> --include <BLOCKNUMBER(S)> --output <OUTPUT_DIR>

# Inside this repo
node dist/cli/index.js search --provider <RPC_URL> --include <BLOCKNUMBER(S)> --output <OUTPUT_DIR>
```

Where `--include` is optional and blocknumbers is a comma-separated list (single: `--include 1530001` multiple: `--include 1530001,1530005,1530011`).

## Setting test inputs

Test inputs can be set by adding a `//$` decorator followed by the chaindata object path to each input.

```javascript
blockNumber: 4000000, //$ account.eoa[8].blockNumber
```

## Running integration tests

Prefix a `CHAIN_ID` environmental variable before running your test. Ensure that `RPC_URL_${CHAIN_ID}` and `PRIVATE_KEY_${CHAIN_ID}` exist in `.env` before running.

```bash
CHAIN_ID=11155111 pnpm jest test/integration/start.test.ts
```

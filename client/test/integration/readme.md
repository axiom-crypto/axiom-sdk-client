# Client SDK Integration Tests

## Running tests

Setting the CHAIN_ID environment variable is required to run the test:

```bash
CHAIN_ID=11155111 pnpm jest test/integration
```

Integration tests will call the `generateCircuit` helper function that takes in a relative path to the circuit. The input path is generated from the chainId.

**NOTE:** Imports in the integration tests use `@axiom-crypto/circuit` instead of `@axiom-crypto/client`.

## Creating additional tests

Please see the README.md file in `/scripts/test`.

# axiom-client-sdk

## Usage

See [./examples/account_age.rs] for an example Axiom compute circuit. To run the `account_age` circuit:

```
cargo run --example account_age -- --input data/quickstart_input.json -k 12 -p <PROVIDER_URI> <CMD>
```

where `PROVIDER_URI` is a JSON-RPC URL, and `CMD` is `mock`, `prove`, `keygen`, or `run`.
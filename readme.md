# @axiom-crypto/client

This repository is split into 3 components:

- `client`: Contains the Axiom CLI interface and developer-facing AxiomCircuit exports
- `circuit`: Handles lower-level interface with Wasm circuit libraries
- `harness`: Test harness for `client`

## Convenience scripts

- `pnpm local`: Updates each package's dependencies in this repository to local links
- `pnpm versions`: Updates the version number for each package's dependencies in this repository to versions declared in their respective package.json's version value
- `pnpm publish-all`: Publishes all packages in sequential order: `circuit`, `client`, then `harness`
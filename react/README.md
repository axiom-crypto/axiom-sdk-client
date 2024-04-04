# Axiom React Components

## What is Axiom

[Axiom](https://www.axiom.xyz/) allows smart contracts to compute over the entire history of Ethereum. Smart contracts can query Axiom on-chain, and Axiom results are verified on-chain in ZK and delivered to the target smart contract via callback.

This package provides React components and hooks to help you integrate Axiom into your React or Next.js webapp.

## Getting Started

Starting a new Axiom project is easy:

```bash
npx create-axiom-client
```

Set a directory to start your project in and then select `Next.js` in the options list to scaffold a new Axiom Next.js dApp.

## Refactoring for Vite Compatibility

As part of an update to improve the build process and developer experience, the Axiom React components have been refactored for compatibility with Vite. This includes the following changes:

- Updated `package.json` to include Vite as a build tool and define new scripts for development and build processes.
- Created a `vite.config.js` file to configure Vite for a React and TypeScript project, including plugins and server options.
- Refactored the entry point file `src/index.tsx` to use the `createRoot` API from `react-dom/client` for React 18 compatibility.
- Added an `index.html` file in the project root as the entry point for Vite, referencing the built JavaScript file.
- The `App.tsx` file has been created as the main application component, which will be the root component for the React application.
- Local dependencies for `@axiom-crypto/client` and `@axiom-crypto/circuit` have been linked in `package.json` to ensure correct resolution.
- The build output directory has been set to `dist/assets`, with the built files named according to the Vite convention (e.g., `index.[hash].js`).

## Docs

For more information on Axiom, see the [homepage](https://axiom.xyz) or [Developer Docs](https://docs.axiom.xyz).

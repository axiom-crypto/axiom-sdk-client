# axiom-client harness

Client harness that allows for easy circuit parameter generation

Run via:

```
npx harness run <circuit.js file>
```

Saves output to `./data/` unless a different output directory is specified.

## Javascript circuit format

Code and input should be in the same file, with input parameters specified as a Javascript object called `const input = {...}`.

Example circuit.js file:

```javascript
for (let i = 0; i < 7; i++) {
  const acct = getAccount(add(claimedBlockNumber, i), address);
  const balance = await acct.balance();
  addToCallback(balance);
}

const input = {
  address: "0x897dDbe14c9C7736EbfDC58461355697FbF70048",
  claimedBlockNumber: 9173677,
};
```

const blockNumber = constant(4000000);
for (let i = 0; i < 7; i++) {
  const acct = getAccount(blockNumber, "0x" + i.toString(16));
  addToCallback(await acct.balance());
}

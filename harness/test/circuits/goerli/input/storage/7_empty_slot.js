const blockNumber = 1000000;
for (let i = 0; i < 7; i++) {
  const acct = getStorage(add(blockNumber, i), "0x" + i.toString(16));
  addToCallback(await acct.slot(i));
}

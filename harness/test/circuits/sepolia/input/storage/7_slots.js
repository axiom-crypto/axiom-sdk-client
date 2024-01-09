const blockNumber = 4500000;
for (let i = 0; i < 7; i++) {
  const acct = getStorage(add(blockNumber, i), "0x1F98431c8aD98523631AE4a59f267346ea31F984");
  addToCallback(await acct.slot(i));
}

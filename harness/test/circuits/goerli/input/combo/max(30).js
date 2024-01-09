for (let i = 0; i < 8; i++) {
  let tx = getReceipt(9000050 + i, i);
  addToCallback(await tx.cumulativeGas());
}

for (let i = 0; i < 8; i++) {
  let tx = getTx(9000000 + i, 10 + i);
  addToCallback(await tx.r());
}

for (let i = 0; i < 4; i++) {
  let mapping = getSolidityMapping(9730000 + i, "0x8dde5d4a8384f403f888e1419672d94c570440c9", 1);
  addToCallback(await mapping.key(2));
}

const blockNumber = constant(5000000);
for (let i = 0; i < 3; i++) {
  const acct = getStorage(add(blockNumber, i), "0xc76531Bb08e8E266E4eB8a988D314AA6650292af");
  addToCallback(await acct.slot(i));
}

for (let i = 0; i < 7; i++) {
  const header = getHeader(add(9173677, i));
  addToCallback(await header.stateRoot());
}

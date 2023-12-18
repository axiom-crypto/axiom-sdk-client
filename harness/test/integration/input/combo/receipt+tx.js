for (let i = 0; i < 8; i++) {
  let tx = getReceipt(9000050 + i, i);
  addToCallback(await tx.cumulativeGas());
}

for (let i = 0; i < 8; i++) {
  let tx = getTx(9000000 + i, 10 + i);
  addToCallback(await tx.r());
}

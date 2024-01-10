for (let i = 0; i < 8; i++) {
  let tx = getReceipt(4800009 + i, i);
  addToCallback(await tx.cumulativeGas());
}

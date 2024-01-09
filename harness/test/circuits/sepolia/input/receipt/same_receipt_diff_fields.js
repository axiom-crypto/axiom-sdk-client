for (let i = 0; i < 2; i++) {
  let tx = getReceipt(4000050 + i, i);
  await tx.blockNumber();
  await tx.cumulativeGas();
  await tx.txIdx();
  await tx.status();
}

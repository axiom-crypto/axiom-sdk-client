for (let i = 0; i < 8; i++) {
  let tx = getTx(4000000 + i, i); // 8000001 is legacy tx
  addToCallback(await tx.r());
}

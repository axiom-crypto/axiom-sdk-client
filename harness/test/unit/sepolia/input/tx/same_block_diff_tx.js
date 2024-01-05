for (let i = 0; i < 8; i++) {
  let tx = getTx(4800009, i);
  addToCallback(await tx.r());
}

let mapping = getSolidityMapping(4800000, "0x1F98431c8aD98523631AE4a59f267346ea31F984", 1);
for (let i = 0; i < 7; i++) {
  addToCallback(await mapping.key(100 * i));
}

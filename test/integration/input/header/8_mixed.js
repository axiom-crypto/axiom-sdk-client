const header = getHeader(claimedBlockNumber);
addToCallback(await header.baseFeePerGas());
addToCallback(await header.difficulty());
addToCallback(await header.extraData());
header.timestamp();
header.miner();
header.mixHash();
header.nonce();
header.mixHash();

const input = {
  claimedBlockNumber: 9173677,
};

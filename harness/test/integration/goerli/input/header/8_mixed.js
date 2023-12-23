const header = getHeader(claimedBlockNumber);
addToCallback(await header.baseFeePerGas());
addToCallback(await header.difficulty());
addToCallback(await header.extraData());
addToCallback(await header.timestamp());
addToCallback(await header.miner());
addToCallback(await header.mixHash());
addToCallback(await header.nonce());
addToCallback(await header.mixHash());

const input = {
  claimedBlockNumber: 9173677,
};

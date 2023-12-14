for (let i = 0; i < 7; i++) {
  const acct = getAccount(add(claimedBlockNumber, i), address);
  const balance = await acct.balance();
  addToCallback(balance);
}

const input = {
  address: "0x897dDbe14c9C7736EbfDC58461355697FbF70048",
  claimedBlockNumber: 9173677,
};

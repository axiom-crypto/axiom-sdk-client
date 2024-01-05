for (let i = 0; i < 7; i++) {
  const acct = getAccount(add(claimedBlockNumber, i), address);
  const balance = await acct.balance();
  addToCallback(balance);
}

const input = {
  address: "0xB392448932F6ef430555631f765Df0dfaE34efF3",
  claimedBlockNumber: 4917000,
};

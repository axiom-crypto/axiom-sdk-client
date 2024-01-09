for(let i=0; i<8; i++){
    const header = getHeader(add(3000000, i));
    addToCallback(await header.stateRoot())
}

const input = {
    claimedBlockNumber: 3000000,
}
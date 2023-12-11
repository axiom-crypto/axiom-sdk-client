for(let i=0; i<8; i++){
    const header = getHeader(add(9173677, i));
    addToCallback(await header.stateRoot())
}

const input = {
    claimedBlockNumber: 9173677,
}
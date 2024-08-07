#!/bin/bash

cd $(git rev-parse --show-toplevel)

cd harness
source .env

cd solidity_sized_tx_contract

forge script ./script/TransactionSender.s.sol:TransactionSenderScript --private-key $PRIVATE_KEY --rpc-url $RPC_URL --force -vvvv --broadcast

cd ../..
#!/bin/bash

cd $(git rev-parse --show-toplevel)
source .env

cd scripts/test/solidity_sized_tx_contract

forge script ./script/TransactionSender.s.sol:TransactionSenderScript --private-key $PRIVATE_KEY --rpc-url $PROVIDER_URI --force --verify --etherscan-api-key $ETHERSCAN_API_KEY -vvvv --broadcast

cd -
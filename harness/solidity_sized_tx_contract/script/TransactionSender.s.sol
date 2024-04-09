// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Script, console2} from "forge-std/Script.sol";
import {TransactionSender} from "../src/TransactionSender.sol";

contract TransactionSenderScript is Script {
    uint256 public constant TX_DATA_LARGE = 32768 - 64;
    uint256 public constant TX_DATA_MAX = 130940 - 64; // actual max is 330000 but Forge has max of 131709
    uint256 public constant RC_LARGE_LOG_SIZE = 2048 - 64;
    uint256 public constant RC_LARGE_NUM_LOGS = 80;
    uint256 public constant RC_MAX_LOG_SIZE = 1024 - 64;
    uint256 public constant RC_MAX_NUM_LOGS = 400;

    TransactionSender transactionSender;

    function setUp() public {
        vm.startBroadcast();
        transactionSender = new TransactionSender();
        vm.stopBroadcast();
    }

    function run() public {
        vm.startBroadcast();
        
        transactionSender.sendTxWithCalldata(new bytes(TX_DATA_LARGE));
        transactionSender.sendTxWithCalldata(new bytes(TX_DATA_MAX));

        transactionSender.sendTxWithLogs(new bytes(RC_LARGE_LOG_SIZE), RC_LARGE_NUM_LOGS);
        transactionSender.sendTxWithLogs(new bytes(RC_MAX_LOG_SIZE), RC_MAX_NUM_LOGS);
        
        vm.stopBroadcast();
    }
}

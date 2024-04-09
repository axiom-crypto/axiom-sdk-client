// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TransactionSender {
    event TransactionSent();
    event DataEvent(bytes data);

    function sendTxWithCalldata(bytes calldata) external {
        emit TransactionSent();
    }

    function sendTxWithLogs(bytes calldata _data, uint256 numLogs) external {
        for (uint256 i = 0; i < numLogs; i++) {
            emit DataEvent(_data);
        }
    }
}

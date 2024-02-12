// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "forge-std/Test.sol";
import "../contracts/HashedTimelock.sol";

contract HashedTimelockTest is Test {
    HashedTimelock htlc;
    address payable sender;
    address payable receiver;
    uint amount = 1 ether;
    bytes32 hashlock;
    bytes32 preimage;
    bytes32 wrongPreimage = "wrong";
    uint timelock;

    function setUp() public {
        sender = payable(address(0x123));
        receiver = payable(address(0x456));
        htlc = new HashedTimelock();
        preimage = "secret";
        console.logBytes("secret");
        hashlock = sha256(abi.encodePacked(preimage));
        timelock = block.timestamp + 1 days;

        vm.deal(sender, amount); // Provide the sender with some Ether
        vm.startPrank(sender);
    }

    function testNewContract() public {
        bytes32 contractId = htlc.newContract{value: amount}(
            receiver,
            hashlock,
            timelock
        );
        assertTrue(htlc.haveContract(contractId));
    }

    function testWithdraw() public {
        bytes32 contractId = htlc.newContract{value: amount}(
            receiver,
            hashlock,
            timelock
        );
        vm.stopPrank();
        vm.startPrank(receiver);

        bool success = htlc.withdraw(contractId, preimage);
        assertTrue(success);

        // Verify receiver's balance has increased by the contract amount
        assertEq(receiver.balance, amount);
    }

    function testWithdrawWithIncorrectPreimage() public {
        bytes32 contractId = htlc.newContract{value: amount}(
            receiver,
            hashlock,
            timelock
        );
        vm.stopPrank();
        vm.startPrank(receiver);

        vm.expectRevert("hashlock hash does not match");
        htlc.withdraw(contractId, wrongPreimage);
    }

    function testWithdrawAfterTimelockExpired() public {
        bytes32 contractId = htlc.newContract{value: amount}(
            receiver,
            hashlock,
            timelock
        );
        vm.stopPrank();

        // Fast forward time to after the timelock expiration
        vm.warp(timelock + 1);

        vm.startPrank(receiver);
        vm.expectRevert("withdrawable: timelock time must be in the future");
        htlc.withdraw(contractId, preimage);
    }

    function testRefundBeforeTimelockExpires() public {
        bytes32 contractId = htlc.newContract{value: amount}(
            receiver,
            hashlock,
            timelock
        );
        vm.stopPrank();

        vm.startPrank(sender);
        vm.expectRevert("refundable: timelock not yet passed");
        htlc.refund(contractId);
    }

    function testSuccessfulRefundAfterTimelockExpires() public {
        bytes32 contractId = htlc.newContract{value: amount}(
            receiver,
            hashlock,
            timelock
        );
        vm.stopPrank();

        // Fast forward time to after the timelock expiration
        vm.warp(timelock + 1);

        vm.startPrank(sender);

        bool success = htlc.refund(contractId);
        assertTrue(success);

        // Verify sender's balance has been refunded
        assertEq(sender.balance, amount);
    }
}

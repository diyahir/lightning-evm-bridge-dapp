// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

// Useful for debugging. Remove when deploying to a live network.
import "forge-std/console.sol";

/**
 * A smart contract that allows changing a state variable of the contract and tracking the changes
 * It also allows the owner to withdraw the Ether in the contract
 * @author BuidlGuidl
 */
contract HashedTimelock {
    event LogHTLCNew(
        bytes32 indexed contractId,
        address indexed sender,
        address indexed receiver,
        uint amount,
        bytes32 hashlock,
        uint timelock
    );
    event LogHTLCWithdraw(bytes32 indexed contractId);
    event LogHTLCRefund(bytes32 indexed contractId);

    struct LockContract {
        address payable sender;
        address payable receiver;
        uint amount;
        bytes32 hashlock; // sha-2 sha256 hash
        uint timelock; // UNIX timestamp seconds - locked UNTIL this time
        bool withdrawn;
        bool refunded;
        bytes32 preimage;
    }

    uint256 constant WITHDRAW_GAS_COST  = 120_000;

    mapping(bytes32 => LockContract) contracts;

    modifier fundsSent() {
        if (msg.value <= 0) revert("msg.value must be > 0");
        _;
    }
    modifier futureTimelock(uint _time) {
        if (_time <= block.timestamp)
            revert("timelock time must be in the future");
        _;
    }
    modifier contractExists(bytes32 _contractId) {
        if (!haveContract(_contractId)) revert("contractId does not exist");
        _;
    }
    modifier hashlockMatches(bytes32 _contractId, bytes32 _x) {
        if (contracts[_contractId].hashlock != sha256(abi.encodePacked(_x)))
            revert("hashlock hash does not match");
        _;
    }
    modifier withdrawable(bytes32 _contractId) {
        if (contracts[_contractId].withdrawn)
            revert("withdrawable: already withdrawn");
        if (contracts[_contractId].timelock <= block.timestamp)
            revert("withdrawable: timelock time must be in the future");
        _;
    }
    modifier refundable(bytes32 _contractId) {
        if (contracts[_contractId].sender != msg.sender)
            revert("refundable: not sender");
        if (contracts[_contractId].refunded)
            revert("refundable: already refunded");
        if (contracts[_contractId].withdrawn)
            revert("refundable: already withdrawn");
        if (contracts[_contractId].timelock > block.timestamp)
            revert("refundable: timelock not yet passed");
        _;
    }

    function newContract(
        address payable _receiver,
        bytes32 _hashlock,
        uint _timelock
    )
        external
        payable
        fundsSent
        futureTimelock(_timelock)
        returns (bytes32 contractId)
    {
        contractId = sha256(
            abi.encodePacked(
                msg.sender,
                _receiver,
                msg.value,
                _hashlock,
                _timelock
            )
        );

        if (haveContract(contractId)) revert("Contract already exists");

        contracts[contractId] = LockContract(
            payable(msg.sender),
            _receiver,
            msg.value,
            _hashlock,
            _timelock,
            false,
            false,
            0x0
        );

        emit LogHTLCNew(
            contractId,
            msg.sender,
            _receiver,
            msg.value,
            _hashlock,
            _timelock
        );
    }

    function withdraw(
        bytes32 _contractId,
        bytes32 _preimage
    )
        external
        contractExists(_contractId)
        hashlockMatches(_contractId, _preimage)
        withdrawable(_contractId)
        returns (bool)
    {
        LockContract storage c = contracts[_contractId];
        c.preimage = _preimage;
        c.withdrawn = true;
        c.receiver.transfer(c.amount);
        emit LogHTLCWithdraw(_contractId);
        return true;
    }

    function withdrawWithBounty(
        bytes32 _contractId,
        bytes32 _preimage
    )
        external
        contractExists(_contractId)
        hashlockMatches(_contractId, _preimage)
        withdrawable(_contractId)
        returns (bool)
    {
        LockContract storage c = contracts[_contractId];
        c.preimage = _preimage;
        c.withdrawn = true;
        uint256 bounty = calculateBounty();
        if (c.amount < bounty) revert("Bounty is greater than the amount");
        c.receiver.transfer(c.amount - bounty);
        payable(msg.sender).transfer(bounty);
        emit LogHTLCWithdraw(_contractId);
        return true;
    }

    function calculateBounty() public view returns (uint) {
        return WITHDRAW_GAS_COST * block.basefee * 120 / 100;
    }

    function refund(
        bytes32 _contractId
    )
        external
        contractExists(_contractId)
        refundable(_contractId)
        returns (bool)
    {
        LockContract storage c = contracts[_contractId];
        c.refunded = true;
        c.sender.transfer(c.amount);
        emit LogHTLCRefund(_contractId);
        return true;
    }

    function getContract(
        bytes32 _contractId
    )
        public
        view
        returns (
            address sender,
            address receiver,
            uint amount,
            bytes32 hashlock,
            uint timelock,
            bool withdrawn,
            bool refunded,
            bytes32 preimage
        )
    {
        if (!haveContract(_contractId))
            return (address(0), address(0), 0, 0x0, 0, false, false, 0x0);
        LockContract storage c = contracts[_contractId];
        return (
            c.sender,
            c.receiver,
            c.amount,
            c.hashlock,
            c.timelock,
            c.withdrawn,
            c.refunded,
            c.preimage
        );
    }

    function haveContract(
        bytes32 _contractId
    ) public view returns (bool exists) {
        exists = (contracts[_contractId].sender != address(0));
    }
}

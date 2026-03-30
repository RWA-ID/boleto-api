// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IBoletoFactory {
    event EventDeployed(
        bytes32 indexed eventId,
        address indexed splitter,
        address indexed ticket
    );

    function platform() external view returns (address);

    function deployEvent(
        bytes32         eventId,
        address         promoter,
        uint256         promoterBps,
        string calldata name,
        string calldata symbol,
        bytes32         merkleRoot,
        string calldata ensName,
        bool            soulbound,
        address         ticketOwner
    ) external returns (address splitter, address ticket);
}

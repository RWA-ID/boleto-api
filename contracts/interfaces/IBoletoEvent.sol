// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IBoletoEvent {
    function release(address token) external;

    function platform() external view returns (address);

    function promoter() external view returns (address);

    function platformBps() external view returns (uint256);

    function promoterBps() external view returns (uint256);
}

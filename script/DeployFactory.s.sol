// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/l2/BoletoFactory.sol";

contract DeployFactory is Script {
    function run() external {
        address platform = vm.envAddress("PLATFORM_TREASURY_ADDRESS");

        vm.startBroadcast();

        BoletoFactory factory = new BoletoFactory(platform);

        vm.stopBroadcast();

        console.log("BoletoFactory:", address(factory));
        console.log("Platform:     ", platform);
        console.log("");
        console.log("Next step: Set BOLETO_FACTORY_ADDRESS in .env");
    }
}

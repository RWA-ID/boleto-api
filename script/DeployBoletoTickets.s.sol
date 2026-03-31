// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/BoletoTickets.sol";

contract DeployBoletoTickets is Script {
    function run() external {
        address treasury = vm.envAddress("PLATFORM_TREASURY_ADDRESS");
        // Backend wallet = deployer = signer for vouchers + direct mints
        address backend  = vm.envOr("BACKEND_WALLET", msg.sender);

        vm.startBroadcast();

        BoletoTickets tickets = new BoletoTickets(backend, treasury);

        console.log("BoletoTickets deployed:", address(tickets));
        console.log("Minter (backend wallet):", backend);
        console.log("Royalty recipient (treasury):", treasury);

        vm.stopBroadcast();
    }
}

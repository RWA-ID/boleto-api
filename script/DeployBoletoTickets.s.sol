// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/BoletoTickets.sol";

contract DeployBoletoTickets is Script {
    function run() external {
        address treasury = vm.envAddress("PLATFORM_TREASURY_ADDRESS");
        address backend  = vm.envAddress("BOLETO_ETH_NODE"); // API backend wallet — added as minter

        vm.startBroadcast();

        BoletoTickets tickets = new BoletoTickets(treasury);
        tickets.addMinter(backend);

        console.log("BoletoTickets deployed:", address(tickets));
        console.log("Treasury (royalty recipient):", treasury);
        console.log("Minter (backend wallet):", backend);

        vm.stopBroadcast();
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../contracts/l1/BoletoRegistrar.sol";

contract DeployRegistrar is Script {
    // Mainnet ENS addresses
    address constant ENS_REGISTRY    = 0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e;
    address constant NAME_WRAPPER    = 0xD4416b13d2b3a9aBae7AcD5D6C2BbDBE25686401;
    address constant PUBLIC_RESOLVER = 0x231b0Ee14048e9dCcD1d247744d114a4EB5E8E63;
    address constant USDC            = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;

    // namehash("boleto.eth") — pre-computed via ethers.namehash('boleto.eth')
    bytes32 constant BOLETO_ETH_NODE = 0x1fd7c395426f74dff675c2c0667966b8da878aa6c5c4c7b17e624f0f2865ab62;

    function run() external {
        address treasury = vm.envAddress("PLATFORM_TREASURY_ADDRESS");

        vm.startBroadcast();

        BoletoRegistrar registrar = new BoletoRegistrar(
            USDC,
            treasury,
            ENS_REGISTRY,
            NAME_WRAPPER,
            PUBLIC_RESOLVER,
            BOLETO_ETH_NODE
        );

        vm.stopBroadcast();

        console.log("BoletoRegistrar:", address(registrar));
        console.log("Treasury:       ", treasury);
        console.log("boleto.eth node:", vm.toString(BOLETO_ETH_NODE));
        console.log("");
        console.log("Next steps:");
        console.log("  1. Set BOLETO_REGISTRAR_ADDRESS in .env");
        console.log("  2. Grant BoletoRegistrar operator approval on NameWrapper for boleto.eth");
    }
}

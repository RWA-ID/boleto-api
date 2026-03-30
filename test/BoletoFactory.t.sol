// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/l2/BoletoFactory.sol";
import "../contracts/l2/BoletoTicket.sol";
import "../contracts/l2/RoyaltySplitter.sol";

contract BoletoFactoryTest is Test {
    BoletoFactory factory;

    address owner    = address(this);
    address platform = address(0x1111);
    address promoter = address(0x2222);
    address apiWallet = address(0x3333);

    bytes32 eventId  = keccak256("badbunny-miami25");

    function setUp() public {
        factory = new BoletoFactory(platform);
    }

    // ── deployEvent ───────────────────────────────────────────────────────────

    function test_deployEventReturnsAddresses() public {
        (address splitter, address ticket) = factory.deployEvent(
            eventId, promoter, 250,
            "Bad Bunny Miami 2025", "BBM25",
            bytes32(0), "badbunny-miami25.boleto.eth",
            true, apiWallet
        );

        assertTrue(splitter != address(0));
        assertTrue(ticket   != address(0));
        assertTrue(splitter != ticket);
    }

    function test_deployEventEmitsEvent() public {
        // We only check that EventDeployed fires — addresses are dynamic
        vm.recordLogs();
        factory.deployEvent(
            eventId, promoter, 250,
            "Bad Bunny Miami 2025", "BBM25",
            bytes32(0), "badbunny-miami25.boleto.eth",
            true, apiWallet
        );
        Vm.Log[] memory logs = vm.getRecordedLogs();
        // EventDeployed + Transfer (ownership) logs expected
        bool found = false;
        for (uint i = 0; i < logs.length; i++) {
            if (logs[i].topics[0] == keccak256("EventDeployed(bytes32,address,address)")) {
                found = true;
                assertEq(logs[i].topics[1], eventId);
            }
        }
        assertTrue(found, "EventDeployed not emitted");
    }

    function test_splitterHardcodedPlatformBps() public {
        (address splitter,) = factory.deployEvent(
            eventId, promoter, 250,
            "Test", "TST", bytes32(0), "test.boleto.eth", false, apiWallet
        );
        assertEq(RoyaltySplitter(payable(splitter)).platformBps(), 150);
        assertEq(RoyaltySplitter(payable(splitter)).promoterBps(), 250);
        assertEq(RoyaltySplitter(payable(splitter)).platform(), platform);
        assertEq(RoyaltySplitter(payable(splitter)).promoter(), promoter);
    }

    function test_ticketOwnedByApiWallet() public {
        (, address ticket) = factory.deployEvent(
            eventId, promoter, 250,
            "Test", "TST", bytes32(0), "test.boleto.eth", false, apiWallet
        );
        assertEq(BoletoTicket(ticket).owner(), apiWallet);
    }

    function test_ticketSplitterAddress() public {
        (address splitter, address ticket) = factory.deployEvent(
            eventId, promoter, 250,
            "Test", "TST", bytes32(0), "test.boleto.eth", false, apiWallet
        );
        assertEq(BoletoTicket(ticket).splitter(), splitter);
    }

    function test_ticketSoulboundFlag() public {
        (, address ticket) = factory.deployEvent(
            eventId, promoter, 250,
            "Test", "TST", bytes32(0), "test.boleto.eth",
            true,  // soulbound
            apiWallet
        );
        assertTrue(BoletoTicket(ticket).soulbound());

        (, address ticket2) = factory.deployEvent(
            keccak256("other-event"), promoter, 250,
            "Test2", "TST2", bytes32(0), "test2.boleto.eth",
            false, // transferable
            apiWallet
        );
        assertFalse(BoletoTicket(ticket2).soulbound());
    }

    function test_ticketRoyaltyInfo() public {
        (address splitter, address ticket) = factory.deployEvent(
            eventId, promoter, 250,
            "Test", "TST", bytes32(0), "test.boleto.eth", false, apiWallet
        );
        (address receiver, uint256 amount) = BoletoTicket(ticket).royaltyInfo(1, 10_000);
        assertEq(receiver, splitter);
        assertEq(amount, 400); // (150 + 250) bps of 10_000
    }

    function test_deployEventOnlyOwner() public {
        vm.prank(address(0xDEAD));
        vm.expectRevert();
        factory.deployEvent(
            eventId, promoter, 250,
            "Test", "TST", bytes32(0), "test.boleto.eth", false, apiWallet
        );
    }

    function test_revertInvalidPromoter() public {
        vm.expectRevert("Invalid promoter");
        factory.deployEvent(
            eventId, address(0), 250,
            "Test", "TST", bytes32(0), "test.boleto.eth", false, apiWallet
        );
    }

    function test_revertInvalidPromoterBps() public {
        vm.expectRevert("Invalid promoter bps");
        factory.deployEvent(
            eventId, promoter, 0,
            "Test", "TST", bytes32(0), "test.boleto.eth", false, apiWallet
        );
        vm.expectRevert("Invalid promoter bps");
        factory.deployEvent(
            eventId, promoter, 5001,
            "Test", "TST", bytes32(0), "test.boleto.eth", false, apiWallet
        );
    }

    function test_deployMultipleEvents() public {
        (address s1, address t1) = factory.deployEvent(
            keccak256("event-1"), promoter, 200,
            "Event 1", "EV1", bytes32(0), "event1.boleto.eth", true, apiWallet
        );
        (address s2, address t2) = factory.deployEvent(
            keccak256("event-2"), promoter, 300,
            "Event 2", "EV2", bytes32(0), "event2.boleto.eth", false, apiWallet
        );

        // All four addresses must be distinct
        assertTrue(s1 != s2);
        assertTrue(t1 != t2);
        assertTrue(s1 != t1);
        assertTrue(s2 != t2);
    }
}

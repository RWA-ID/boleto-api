// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/l2/BoletoTicket.sol";

contract BoletoTicketTest is Test {
    BoletoTicket ticket;

    address owner    = address(this);
    address buyer    = address(0xBEEF);
    address buyer2   = address(0xF00D);
    address splitter = address(0xCAFE);
    address redeemer;
    uint256 redeemerKey = 0xDEAD;

    function setUp() public {
        redeemer = vm.addr(redeemerKey);
        ticket = new BoletoTicket(
            "Bad Bunny Miami 2025",
            "BBM25",
            bytes32(0),    // open sale
            splitter,
            "badbunny-miami25.boleto.eth",
            400,           // 1.5% platform + 2.5% promoter = 4%
            false,         // transferable by default
            owner
        );
        ticket.addRedeemer(redeemer);
    }

    // ── Minting ───────────────────────────────────────────────────────────────

    function test_mintSuccess() public {
        bytes32[] memory proof = new bytes32[](0);
        ticket.mint(buyer, "A-1", "Floor VIP", "A", "ipfs://Qm1", proof);

        (bool valid, bool used) = ticket.isValid(1);
        assertTrue(valid);
        assertFalse(used);
        assertEq(ticket.ownerOf(1), buyer);
    }

    function test_mintSameSeatTwiceReverts() public {
        bytes32[] memory proof = new bytes32[](0);
        ticket.mint(buyer, "A-1", "Floor VIP", "A", "ipfs://Qm1", proof);

        vm.expectRevert("Seat already minted");
        ticket.mint(buyer2, "A-1", "Floor VIP", "A", "ipfs://Qm2", proof);
    }

    function test_mintOnlyOwner() public {
        bytes32[] memory proof = new bytes32[](0);
        vm.prank(buyer);
        vm.expectRevert();
        ticket.mint(buyer, "B-1", "General", "B", "ipfs://Qm3", proof);
    }

    function test_seatIdToTokenMapping() public {
        bytes32[] memory proof = new bytes32[](0);
        ticket.mint(buyer, "C-5", "General", "C", "ipfs://Qm4", proof);
        assertEq(ticket.seatIdToToken("C-5"), 1);
    }

    // ── Soulbound ─────────────────────────────────────────────────────────────

    function test_transferableByDefault() public {
        bytes32[] memory proof = new bytes32[](0);
        ticket.mint(buyer, "A-1", "VIP", "A", "ipfs://Qm1", proof);

        // Transfer should succeed (not soulbound)
        vm.prank(buyer);
        ticket.transferFrom(buyer, buyer2, 1);
        assertEq(ticket.ownerOf(1), buyer2);
    }

    function test_soulboundBlocksTransfer() public {
        BoletoTicket sb = new BoletoTicket(
            "Soulbound Event", "SBE", bytes32(0), splitter,
            "test.boleto.eth", 400, true, owner
        );
        bytes32[] memory proof = new bytes32[](0);
        sb.mint(buyer, "A-1", "VIP", "A", "ipfs://Qm1", proof);

        vm.prank(buyer);
        vm.expectRevert("Ticket is soulbound: transfers disabled");
        sb.transferFrom(buyer, buyer2, 1);
    }

    function test_soulboundAllowsMint() public {
        // Minting (from == address(0)) always works even when soulbound
        BoletoTicket sb = new BoletoTicket(
            "Soulbound Event", "SBE", bytes32(0), splitter,
            "test.boleto.eth", 400, true, owner
        );
        bytes32[] memory proof = new bytes32[](0);
        sb.mint(buyer, "A-1", "VIP", "A", "ipfs://Qm1", proof);
        assertEq(sb.ownerOf(1), buyer);
    }

    function test_setSoulboundToggle() public {
        bytes32[] memory proof = new bytes32[](0);
        ticket.mint(buyer, "A-1", "VIP", "A", "ipfs://Qm1", proof);

        // Lock it
        ticket.setSoulbound(true);
        vm.prank(buyer);
        vm.expectRevert("Ticket is soulbound: transfers disabled");
        ticket.transferFrom(buyer, buyer2, 1);

        // Unlock it
        ticket.setSoulbound(false);
        vm.prank(buyer);
        ticket.transferFrom(buyer, buyer2, 1);
        assertEq(ticket.ownerOf(1), buyer2);
    }

    function test_setSoulboundOnlyOwner() public {
        vm.prank(buyer);
        vm.expectRevert();
        ticket.setSoulbound(true);
    }

    function test_setSoulboundEmitsEvent() public {
        vm.expectEmit(false, false, false, true);
        emit BoletoTicket.SoulboundSet(true);
        ticket.setSoulbound(true);
    }

    // ── Open vs allowlist ─────────────────────────────────────────────────────

    function test_openSaleNoProofNeeded() public {
        bytes32[] memory proof = new bytes32[](0);
        ticket.mint(buyer, "D-1", "Balcony", "D", "ipfs://Qm5", proof);
        (bool valid,) = ticket.isValid(1);
        assertTrue(valid);
    }

    function test_merkleRootEnforcesProof() public {
        bytes32 root = keccak256(abi.encodePacked(buyer));
        BoletoTicket t2 = new BoletoTicket(
            "Test", "TST", root, splitter, "test.boleto.eth", 400, false, owner
        );

        bytes32[] memory emptyProof = new bytes32[](0);

        vm.expectRevert("Invalid merkle proof");
        t2.mint(address(0xBAD), "A-1", "VIP", "A", "ipfs://Qm6", emptyProof);

        // Single-node tree: leaf == root, empty proof
        t2.mint(buyer, "A-2", "VIP", "A", "ipfs://Qm7", emptyProof);
        (bool valid,) = t2.isValid(1);
        assertTrue(valid);
    }

    // ── Redemption ────────────────────────────────────────────────────────────

    function test_redeemSuccess() public {
        bytes32[] memory proof = new bytes32[](0);
        ticket.mint(buyer, "E-1", "General", "E", "ipfs://Qm8", proof);

        bytes32 hash      = keccak256(abi.encodePacked(uint256(1), address(ticket), "redeem"));
        bytes32 digest    = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(redeemerKey, digest);
        bytes memory sig  = abi.encodePacked(r, s, v);

        ticket.redeem(1, sig);

        (, bool used) = ticket.isValid(1);
        assertTrue(used);
    }

    function test_cannotRedeemTwice() public {
        bytes32[] memory proof = new bytes32[](0);
        ticket.mint(buyer, "F-1", "General", "F", "ipfs://Qm9", proof);

        bytes32 hash      = keccak256(abi.encodePacked(uint256(1), address(ticket), "redeem"));
        bytes32 digest    = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(redeemerKey, digest);
        bytes memory sig  = abi.encodePacked(r, s, v);

        ticket.redeem(1, sig);
        vm.expectRevert("Already redeemed");
        ticket.redeem(1, sig);
    }

    function test_unauthorizedRedeemerReverts() public {
        bytes32[] memory proof = new bytes32[](0);
        ticket.mint(buyer, "G-1", "General", "G", "ipfs://Qm10", proof);

        uint256 badKey   = 0xBADBAD;
        bytes32 hash     = keccak256(abi.encodePacked(uint256(1), address(ticket), "redeem"));
        bytes32 digest   = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", hash));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(badKey, digest);
        bytes memory sig = abi.encodePacked(r, s, v);

        vm.expectRevert("Unauthorized redeemer");
        ticket.redeem(1, sig);
    }

    // ── Royalty ───────────────────────────────────────────────────────────────

    function test_royaltyInfoReturnsSplitter() public view {
        (address receiver, uint256 amount) = ticket.royaltyInfo(1, 10_000);
        assertEq(receiver, splitter);
        assertEq(amount, 400); // 4% of 10_000
    }

    // ── isValid edge cases ────────────────────────────────────────────────────

    function test_isValidNonExistentToken() public view {
        (bool valid, bool used) = ticket.isValid(999);
        assertFalse(valid);
        assertFalse(used);
    }
}

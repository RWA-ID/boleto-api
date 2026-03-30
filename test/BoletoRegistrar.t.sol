// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/l1/BoletoRegistrar.sol";

// ── Minimal mocks ─────────────────────────────────────────────────────────────

contract MockUSDC {
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function mint(address to, uint256 amount) external { balanceOf[to] += amount; }

    function approve(address spender, uint256 amount) external returns (bool) {
        allowance[msg.sender][spender] = amount;
        return true;
    }

    function transferFrom(address from, address to, uint256 amount) external returns (bool) {
        require(balanceOf[from] >= amount, "Insufficient balance");
        require(allowance[from][msg.sender] >= amount, "Insufficient allowance");
        balanceOf[from]                  -= amount;
        allowance[from][msg.sender]      -= amount;
        balanceOf[to]                    += amount;
        return true;
    }
}

contract MockNameWrapper {
    function setSubnodeRecord(
        bytes32, string calldata, address, address, uint64, uint32, uint64
    ) external pure returns (bytes32) {
        return bytes32(uint256(1));
    }

    function ownerOf(uint256) external pure returns (address) { return address(0); }
    function isApprovedForAll(address, address) external pure returns (bool) { return true; }
}

contract MockENSRegistry {
    function owner(bytes32) external view returns (address) { return address(this); }
    function setSubnodeRecord(bytes32, bytes32, address, address, uint64) external {}
}

contract MockPublicResolver {
    function setContenthash(bytes32, bytes calldata) external {}
    function setAddr(bytes32, address) external {}
}

// ── Tests ─────────────────────────────────────────────────────────────────────

contract BoletoRegistrarTest is Test {
    BoletoRegistrar  registrar;
    MockUSDC         usdc;
    MockNameWrapper  nameWrapper;
    MockENSRegistry  ensRegistry;
    MockPublicResolver resolver;

    address treasury  = address(0x9999);
    address promoter  = address(0x1234);
    bytes32 boletoNode = keccak256("boleto.eth");

    function setUp() public {
        usdc        = new MockUSDC();
        nameWrapper = new MockNameWrapper();
        ensRegistry = new MockENSRegistry();
        resolver    = new MockPublicResolver();

        registrar = new BoletoRegistrar(
            address(usdc),
            treasury,
            address(ensRegistry),
            address(nameWrapper),
            address(resolver),
            boletoNode
        );

        // Fund promoter with 50M USDC (enough for any tier)
        usdc.mint(promoter, 50_000_000e6);
        vm.prank(promoter);
        usdc.approve(address(registrar), type(uint256).max);
    }

    // ── quoteEvent ────────────────────────────────────────────────────────────

    function test_quoteTier1() public view {
        uint256 fee = registrar.quoteEvent(1000);
        assertEq(fee, 1000 * 650_000); // $650 USDC (6 decimals)
    }

    function test_quoteTier2() public view {
        uint256 fee = registrar.quoteEvent(10_000);
        assertEq(fee, 10_000 * 500_000); // $5,000 USDC
    }

    function test_quoteTier3() public view {
        uint256 fee = registrar.quoteEvent(100_000);
        assertEq(fee, 100_000 * 250_000); // $25,000 USDC
    }

    function test_quoteTierBoundary() public view {
        assertEq(registrar.quoteEvent(9_999),  9_999  * 650_000);
        assertEq(registrar.quoteEvent(10_000), 10_000 * 500_000);
        assertEq(registrar.quoteEvent(49_999), 49_999 * 500_000);
        assertEq(registrar.quoteEvent(50_000), 50_000 * 250_000);
    }

    function test_quoteZeroReverts() public {
        vm.expectRevert("Ticket count must be > 0");
        registrar.quoteEvent(0);
    }

    // ── registerEvent ─────────────────────────────────────────────────────────

    function test_registerEventSuccess() public {
        vm.prank(promoter);
        bytes32 eventId = registrar.registerEvent(
            "badbunny", "miami25", promoter, 5000, "ipfs://Qm1"
        );

        BoletoRegistrar.EventRecord memory ev = registrar.getEvent(eventId);
        assertEq(ev.promoter, promoter);
        assertEq(ev.ticketCount, 5000);
        assertTrue(ev.active);
        assertEq(ev.ensName, "badbunny-miami25.boleto.eth");
    }

    function test_registerEventTransfersUSDC() public {
        uint256 balBefore = usdc.balanceOf(treasury);
        uint256 expected  = 5000 * 650_000;

        vm.prank(promoter);
        registrar.registerEvent("badbunny", "miami25", promoter, 5000, "ipfs://Qm1");

        assertEq(usdc.balanceOf(treasury), balBefore + expected);
    }

    function test_registerEventEmitsEvent() public {
        uint256 fee = 5000 * 650_000;
        bytes32 expectedId = keccak256(bytes("badbunny-miami25"));

        vm.expectEmit(true, true, false, true);
        emit BoletoRegistrar.EventRegistered(
            expectedId, promoter, "badbunny-miami25.boleto.eth", 5000, fee
        );

        vm.prank(promoter);
        registrar.registerEvent("badbunny", "miami25", promoter, 5000, "ipfs://Qm1");
    }

    function test_registerDuplicateReverts() public {
        vm.prank(promoter);
        registrar.registerEvent("badbunny", "miami25", promoter, 5000, "ipfs://Qm1");

        vm.prank(promoter);
        vm.expectRevert("Event already exists");
        registrar.registerEvent("badbunny", "miami25", promoter, 5000, "ipfs://Qm2");
    }

    function test_emptyEventSlugReverts() public {
        vm.prank(promoter);
        vm.expectRevert("Event slug required");
        registrar.registerEvent("badbunny", "", promoter, 5000, "ipfs://Qm1");
    }

    function test_zeroTicketCountReverts() public {
        vm.prank(promoter);
        vm.expectRevert("Ticket count must be > 0");
        registrar.registerEvent("badbunny", "miami25", promoter, 0, "ipfs://Qm1");
    }

    // ── reserveArtist ─────────────────────────────────────────────────────────

    function test_reserveArtistBlocked() public {
        registrar.reserveArtist("badbunny");

        vm.prank(promoter);
        vm.expectRevert("Artist reserved");
        registrar.registerEvent("badbunny", "miami25", promoter, 5000, "ipfs://Qm1");
    }

    function test_reserveArtistOnlyOwner() public {
        vm.prank(promoter);
        vm.expectRevert();
        registrar.reserveArtist("badbunny");
    }

    function test_bulkReserveArtists() public {
        string[] memory slugs = new string[](2);
        slugs[0] = "badbunny";
        slugs[1] = "shakira";
        registrar.bulkReserveArtists(slugs);

        assertTrue(registrar.reservedArtists(keccak256("badbunny")));
        assertTrue(registrar.reservedArtists(keccak256("shakira")));
    }

    // ── setL2Contract ─────────────────────────────────────────────────────────

    function test_setL2Contract() public {
        vm.prank(promoter);
        bytes32 eventId = registrar.registerEvent(
            "badbunny", "miami25", promoter, 5000, "ipfs://Qm1"
        );

        address l2 = address(0xABCD);
        registrar.setL2Contract(eventId, l2);

        assertEq(registrar.getEvent(eventId).l2Contract, l2);
    }

    function test_setL2ContractOnlyOwner() public {
        vm.prank(promoter);
        bytes32 eventId = registrar.registerEvent(
            "badbunny", "miami25", promoter, 5000, "ipfs://Qm1"
        );

        vm.prank(promoter);
        vm.expectRevert();
        registrar.setL2Contract(eventId, address(0xABCD));
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IENSRegistry {
    function owner(bytes32 node) external view returns (address);
    function setSubnodeRecord(
        bytes32 node,
        bytes32 label,
        address owner_,
        address resolver,
        uint64  ttl
    ) external;
}

interface INameWrapper {
    function setSubnodeRecord(
        bytes32 parentNode,
        string  calldata label,
        address owner_,
        address resolver,
        uint64  ttl,
        uint32  fuses,
        uint64  expiry
    ) external returns (bytes32 node);
    function ownerOf(uint256 id) external view returns (address);
    function isApprovedForAll(address owner_, address operator) external view returns (bool);
}

interface IPublicResolver {
    function setContenthash(bytes32 node, bytes calldata hash) external;
    function setAddr(bytes32 node, address addr) external;
}

/**
 * @title BoletoRegistrar
 * @notice L1 ENS registrar for boleto.eth subdomains. Accepts USDC upfront fees.
 * @dev Registers names in the form `artistSlug-eventSlug.boleto.eth`.
 *      artistSlug is ALWAYS passed pre-normalized (hyphens stripped) by the API.
 */
contract BoletoRegistrar is Ownable {

    // ── Constants ─────────────────────────────────────────────────────────────
    // Pricing tiers in USDC (6 decimals)
    uint256 public constant TIER1_MAX    = 9_999;
    uint256 public constant TIER2_MAX    = 49_999;
    uint256 public constant TIER1_PRICE  = 650_000;   // $0.65 per ticket
    uint256 public constant TIER2_PRICE  = 500_000;   // $0.50 per ticket
    uint256 public constant TIER3_PRICE  = 250_000;   // $0.25 per ticket

    // ── Immutable addresses ───────────────────────────────────────────────────
    IERC20          public immutable usdc;
    address         public immutable platformTreasury;
    IENSRegistry    public immutable ensRegistry;
    INameWrapper    public immutable nameWrapper;
    IPublicResolver public immutable publicResolver;
    bytes32         public immutable boletoEthNode;  // namehash("boleto.eth")

    // ── State ─────────────────────────────────────────────────────────────────
    /// @notice keccak256(normalizedSlug) => blocked
    mapping(bytes32  => bool)        public reservedArtists;
    /// @notice keccak256(fullSlug) => EventRecord  (fullSlug = artistSlug-eventSlug)
    mapping(bytes32  => EventRecord) public events;

    struct EventRecord {
        address promoter;
        uint256 ticketCount;
        address l2Contract;   // set after L2 deployment via setL2Contract
        string  ensName;      // full subdomain string e.g. "badbunny-miami25.boleto.eth"
        bool    active;
    }

    // ── Events ────────────────────────────────────────────────────────────────
    event EventRegistered(
        bytes32 indexed eventId,
        address indexed promoter,
        string  ensName,
        uint256 ticketCount,
        uint256 feePaid
    );
    event L2ContractSet(bytes32 indexed eventId, address l2Contract);
    event ArtistReserved(bytes32 indexed normalizedHash, string slug);

    // ── Constructor ───────────────────────────────────────────────────────────
    constructor(
        address _usdc,
        address _platformTreasury,
        address _ensRegistry,
        address _nameWrapper,
        address _publicResolver,
        bytes32 _boletoEthNode
    ) Ownable(msg.sender) {
        require(_usdc             != address(0), "Invalid USDC");
        require(_platformTreasury != address(0), "Invalid treasury");
        require(_ensRegistry      != address(0), "Invalid ENS registry");
        require(_nameWrapper      != address(0), "Invalid NameWrapper");
        require(_publicResolver   != address(0), "Invalid resolver");

        usdc             = IERC20(_usdc);
        platformTreasury = _platformTreasury;
        ensRegistry      = IENSRegistry(_ensRegistry);
        nameWrapper      = INameWrapper(_nameWrapper);
        publicResolver   = IPublicResolver(_publicResolver);
        boletoEthNode    = _boletoEthNode;
    }

    // ── Views ─────────────────────────────────────────────────────────────────

    /**
     * @notice Calculate upfront USDC fee for a given ticket count.
     * @param ticketCount Number of tickets for the event
     * @return usdcFee Total fee in USDC (6 decimals)
     */
    function quoteEvent(uint256 ticketCount) external pure returns (uint256 usdcFee) {
        require(ticketCount > 0, "Ticket count must be > 0");
        if (ticketCount <= TIER1_MAX) {
            return ticketCount * TIER1_PRICE;
        } else if (ticketCount <= TIER2_MAX) {
            return ticketCount * TIER2_PRICE;
        } else {
            return ticketCount * TIER3_PRICE;
        }
    }

    // ── Core ──────────────────────────────────────────────────────────────────

    /**
     * @notice Register an event subdomain and collect USDC fee.
     * @dev artistSlug MUST be pre-normalized by the API (hyphens stripped, lowercase).
     *      Final ENS name registered: `{artistSlug}-{eventSlug}.boleto.eth`
     * @param artistSlug      Normalized artist slug (no hyphens) e.g. "badbunny"
     * @param eventSlug       Event slug e.g. "miami25"
     * @param promoterWallet  Promoter's wallet address
     * @param ticketCount     Number of tickets (determines fee tier)

     * @return eventId        keccak256 of the full subdomain label
     */
    function registerEvent(
        string calldata artistSlug,
        string calldata eventSlug,
        address         promoterWallet,
        uint256         ticketCount,
        string calldata /* ipfsMetadata */
    ) external returns (bytes32 eventId) {
        // Validations
        require(bytes(artistSlug).length > 0, "Empty artist slug");
        require(bytes(eventSlug).length  > 0, "Event slug required");
        require(promoterWallet != address(0), "Invalid promoter wallet");
        require(ticketCount > 0, "Ticket count must be > 0");

        // Check artist not reserved
        require(!reservedArtists[keccak256(bytes(artistSlug))], "Artist reserved");

        // Build full label: "artistSlug-eventSlug"
        string memory fullLabel = string(abi.encodePacked(artistSlug, "-", eventSlug));
        string memory fullName  = string(abi.encodePacked(fullLabel, ".boleto.eth"));
        eventId = keccak256(bytes(fullLabel));

        // Check not already registered
        require(!events[eventId].active, "Event already exists");
        require(bytes(events[eventId].ensName).length == 0, "Event already exists");

        // Calculate and collect fee
        uint256 fee;
        if (ticketCount <= TIER1_MAX) {
            fee = ticketCount * TIER1_PRICE;
        } else if (ticketCount <= TIER2_MAX) {
            fee = ticketCount * TIER2_PRICE;
        } else {
            fee = ticketCount * TIER3_PRICE;
        }

        bool ok = usdc.transferFrom(msg.sender, platformTreasury, fee);
        require(ok, "USDC transfer failed");

        // Register ENS subdomain via NameWrapper
        nameWrapper.setSubnodeRecord(
            boletoEthNode,
            fullLabel,
            promoterWallet,
            address(publicResolver),
            0,             // TTL
            0,             // fuses
            type(uint64).max  // permanent
        );

        // Store event record
        events[eventId] = EventRecord({
            promoter:    promoterWallet,
            ticketCount: ticketCount,
            l2Contract:  address(0),
            ensName:     fullName,
            active:      true
        });

        emit EventRegistered(eventId, promoterWallet, fullName, ticketCount, fee);
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    /**
     * @notice Reserve an artist slug to prevent squatting.
     * @param normalizedSlug Pre-normalized (hyphens stripped, lowercase) artist slug
     */
    function reserveArtist(string calldata normalizedSlug) external onlyOwner {
        bytes32 hash = keccak256(bytes(normalizedSlug));
        reservedArtists[hash] = true;
        emit ArtistReserved(hash, normalizedSlug);
    }

    /**
     * @notice Set the L2 ticket contract address after deployment.
     */
    function setL2Contract(bytes32 eventId, address l2Contract) external onlyOwner {
        require(events[eventId].active, "Event not found");
        require(l2Contract != address(0), "Invalid address");
        events[eventId].l2Contract = l2Contract;
        emit L2ContractSet(eventId, l2Contract);
    }

    /**
     * @notice Bulk reserve artists (used at launch for seed list).
     */
    /**
     * @notice Return the full EventRecord struct for a given eventId.
     * @dev The public mapping getter returns a tuple; this returns the struct directly.
     */
    function getEvent(bytes32 eventId) external view returns (EventRecord memory) {
        return events[eventId];
    }

    function bulkReserveArtists(string[] calldata normalizedSlugs) external onlyOwner {
        for (uint256 i = 0; i < normalizedSlugs.length; i++) {
            bytes32 hash = keccak256(bytes(normalizedSlugs[i]));
            reservedArtists[hash] = true;
            emit ArtistReserved(hash, normalizedSlugs[i]);
        }
    }
}

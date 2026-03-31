// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title  BoletoTickets
 * @notice Shared ERC-721 contract for all boleto.eth events.
 *
 *  Mint paths
 *  ----------
 *  1. mintWithVoucher() — buyer self-mints using an EIP-712 voucher signed by
 *     the boleto.eth backend. No Merkle proof. Buyer pays their own gas.
 *  2. mint() — backend wallet mints directly on behalf of a buyer (fallback /
 *     platform-controlled flow).
 *
 *  Event registration
 *  ------------------
 *  registerEvent() is called once per event (onlyOwner = backend deployer) and
 *  stores the total seat count. Activation costs ~$5 regardless of seat count.
 *  Each seat can only ever be minted once (tracked by seatKey hash).
 */
contract BoletoTickets is ERC721URIStorage, IERC2981, Ownable, EIP712 {

    // ── Constants ─────────────────────────────────────────────────────────────
    uint96 public constant ROYALTY_BPS = 100; // 1%

    /// EIP-712 typehash for TicketVoucher
    bytes32 public constant VOUCHER_TYPEHASH = keccak256(
        "TicketVoucher(bytes32 eventId,address to,string seatNumber,string tokenUri)"
    );

    // ── State ─────────────────────────────────────────────────────────────────
    uint256 private _nextTokenId;
    address public  minter;           // boleto.eth backend wallet (signer + direct-mint)
    address public  royaltyRecipient; // platform treasury

    struct EventRecord {
        bool    registered;
        uint256 totalSeats;
        uint256 mintedCount;
        string  ensName;
        address promoter;
    }

    /// eventId (keccak256 of ENS label) → EventRecord
    mapping(bytes32  => EventRecord) public events;
    /// tokenId → eventId
    mapping(uint256  => bytes32)     public tokenEvent;
    /// keccak256(eventId, seatNumber) → minted  (replay protection)
    mapping(bytes32  => bool)        public seatMinted;

    // ── Events ────────────────────────────────────────────────────────────────
    event EventRegistered(bytes32 indexed eventId, string ensName, address promoter, uint256 totalSeats);
    event TicketMinted(uint256 indexed tokenId, address indexed to, bytes32 indexed eventId, string seatNumber);

    // ── Constructor ───────────────────────────────────────────────────────────
    constructor(
        address _minter,
        address _royaltyRecipient
    )
        ERC721("Boleto Tickets", "BOLETO")
        EIP712("BoletoTickets", "1")
        Ownable(msg.sender)
    {
        require(_minter            != address(0), "Invalid minter");
        require(_royaltyRecipient  != address(0), "Invalid treasury");
        minter           = _minter;
        royaltyRecipient = _royaltyRecipient;
    }

    // ── Event registration ────────────────────────────────────────────────────

    /**
     * @notice Register an event. Called by the backend after USDC fee payment.
     *         Cheap: O(1) gas regardless of seat count.
     * @param eventId    keccak256(ensName)
     * @param totalSeats Total seats sold — sets the supply cap for this event
     * @param ensName    Full ENS name e.g. "artist-event.boleto.eth"
     * @param promoter   Promoter wallet (receives royalties on secondary sales)
     */
    function registerEvent(
        bytes32         eventId,
        uint256         totalSeats,
        string calldata ensName,
        address         promoter
    ) external onlyOwner {
        require(!events[eventId].registered, "Already registered");
        require(totalSeats > 0,              "No seats");

        events[eventId] = EventRecord({
            registered:  true,
            totalSeats:  totalSeats,
            mintedCount: 0,
            ensName:     ensName,
            promoter:    promoter
        });

        emit EventRegistered(eventId, ensName, promoter, totalSeats);
    }

    // ── Buyer self-mint ───────────────────────────────────────────────────────

    /**
     * @notice Mint a ticket using a backend-signed EIP-712 voucher.
     *         Buyer calls this directly — no Merkle proof required.
     * @param eventId   Registered event identifier
     * @param to        Buyer wallet (must match what the backend signed)
     * @param seatNumber Seat identifier e.g. "A-101"
     * @param tokenUri  IPFS metadata URI (generated + signed by backend after purchase)
     * @param signature EIP-712 signature from the boleto.eth minter wallet
     */
    function mintWithVoucher(
        bytes32         eventId,
        address         to,
        string calldata seatNumber,
        string calldata tokenUri,
        bytes  calldata signature
    ) external {
        EventRecord storage ev = events[eventId];
        require(ev.registered,              "Event not registered");
        require(ev.mintedCount < ev.totalSeats, "Sold out");

        bytes32 seatKey = keccak256(abi.encodePacked(eventId, seatNumber));
        require(!seatMinted[seatKey], "Seat already minted");

        // Verify EIP-712 signature
        bytes32 digest = _hashTypedDataV4(keccak256(abi.encode(
            VOUCHER_TYPEHASH,
            eventId,
            to,
            keccak256(bytes(seatNumber)),
            keccak256(bytes(tokenUri))
        )));
        require(ECDSA.recover(digest, signature) == minter, "Invalid voucher");

        seatMinted[seatKey] = true;
        ev.mintedCount++;

        uint256 tokenId = ++_nextTokenId;
        tokenEvent[tokenId] = eventId;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenUri);

        emit TicketMinted(tokenId, to, eventId, seatNumber);
    }

    // ── Direct mint (backend fallback) ────────────────────────────────────────

    /**
     * @notice Mint directly — backend mints on behalf of buyer (no voucher needed).
     *         Used when buyer doesn't have a wallet or wants a gasless experience.
     */
    function mint(
        bytes32         eventId,
        address         to,
        string calldata seatNumber,
        string calldata tokenUri
    ) external returns (uint256 tokenId) {
        require(msg.sender == minter || msg.sender == owner(), "Not authorised");

        EventRecord storage ev = events[eventId];
        require(ev.registered,              "Event not registered");
        require(ev.mintedCount < ev.totalSeats, "Sold out");
        require(to != address(0),           "Invalid recipient");

        bytes32 seatKey = keccak256(abi.encodePacked(eventId, seatNumber));
        require(!seatMinted[seatKey], "Seat already minted");

        seatMinted[seatKey] = true;
        ev.mintedCount++;

        tokenId = ++_nextTokenId;
        tokenEvent[tokenId] = eventId;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenUri);

        emit TicketMinted(tokenId, to, eventId, seatNumber);
    }

    // ── ERC-2981 Royalties ────────────────────────────────────────────────────

    /**
     * @notice Per-event royalty: 1% goes to the promoter wallet.
     */
    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external view override
        returns (address receiver, uint256 royaltyAmount)
    {
        bytes32 eventId = tokenEvent[tokenId];
        address recipient = events[eventId].registered
            ? events[eventId].promoter
            : royaltyRecipient;
        return (recipient, (salePrice * ROYALTY_BPS) / 10_000);
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    function setMinter(address _minter) external onlyOwner {
        require(_minter != address(0), "Invalid minter");
        minter = _minter;
    }

    function setRoyaltyRecipient(address _recipient) external onlyOwner {
        require(_recipient != address(0), "Invalid address");
        royaltyRecipient = _recipient;
    }

    // ── View helpers ──────────────────────────────────────────────────────────

    function registeredEvents(bytes32 eventId) external view returns (bool) {
        return events[eventId].registered;
    }

    function eventEnsName(bytes32 eventId) external view returns (string memory) {
        return events[eventId].ensName;
    }

    // ── ERC-165 ───────────────────────────────────────────────────────────────

    function supportsInterface(bytes4 interfaceId)
        public view override(ERC721URIStorage, IERC165)
        returns (bool)
    {
        return
            interfaceId == type(IERC2981).interfaceId ||
            super.supportsInterface(interfaceId);
    }
}

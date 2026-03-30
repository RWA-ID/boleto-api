// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title  BoletoTickets
 * @notice Single shared ERC-721 contract for all boleto.eth events.
 *         Each event is registered by the boleto.eth owner. Tickets are minted
 *         by authorised minter wallets (boleto.eth backend). Buyers pay their
 *         own gas. 1% ERC-2981 royalty on every secondary sale goes to the
 *         boleto.eth treasury.
 */
contract BoletoTickets is ERC721URIStorage, IERC2981, Ownable {

    // ── Constants ─────────────────────────────────────────────────────────────
    uint96 public constant ROYALTY_BPS = 100; // 1 %

    // ── State ─────────────────────────────────────────────────────────────────
    uint256 private _nextTokenId;
    address public  royaltyRecipient;

    /// eventId (keccak256 of ENS label) → registered
    mapping(bytes32 => bool)    public registeredEvents;
    /// eventId → human-readable ENS name e.g. "badbunny-miami25.boleto.eth"
    mapping(bytes32 => string)  public eventEnsName;
    /// tokenId → eventId
    mapping(uint256 => bytes32) public tokenEvent;
    /// authorised minter wallets (boleto.eth backend)
    mapping(address => bool)    public minters;

    // ── Events ────────────────────────────────────────────────────────────────
    event EventRegistered(bytes32 indexed eventId, string ensName, address promoter);
    event TicketMinted(uint256 indexed tokenId, address indexed to, bytes32 indexed eventId, string seatNumber);
    event MinterAdded(address indexed minter);
    event MinterRemoved(address indexed minter);

    // ── Constructor ───────────────────────────────────────────────────────────
    constructor(address _royaltyRecipient) ERC721("Boleto Tickets", "BOLETO") Ownable(msg.sender) {
        require(_royaltyRecipient != address(0), "Invalid treasury");
        royaltyRecipient = _royaltyRecipient;
    }

    // ── Modifiers ─────────────────────────────────────────────────────────────
    modifier onlyMinter() {
        require(minters[msg.sender] || msg.sender == owner(), "Not authorised");
        _;
    }

    // ── Event registration (owner only) ───────────────────────────────────────
    /**
     * @notice Register a new event. Called by boleto.eth backend after USDC fee payment.
     * @param eventId   keccak256 of the full ENS name label
     * @param ensName   Human-readable ENS name e.g. "badbunny-miami25.boleto.eth"
     * @param promoter  Promoter wallet — stored for off-chain reference
     */
    function registerEvent(
        bytes32        eventId,
        string calldata ensName,
        address        promoter
    ) external onlyOwner {
        require(!registeredEvents[eventId], "Event already registered");
        registeredEvents[eventId] = true;
        eventEnsName[eventId]     = ensName;
        emit EventRegistered(eventId, ensName, promoter);
    }

    // ── Minting ───────────────────────────────────────────────────────────────
    /**
     * @notice Mint a single ticket NFT to a buyer.
     * @param eventId    Registered event identifier
     * @param to         Recipient wallet (buyer or platform wallet for pre-mint)
     * @param seatNumber Human-readable seat / ticket identifier from CSV
     * @param tokenUri   IPFS metadata URI (includes QR code, attributes)
     */
    function mint(
        bytes32         eventId,
        address         to,
        string calldata seatNumber,
        string calldata tokenUri
    ) external onlyMinter returns (uint256 tokenId) {
        require(registeredEvents[eventId], "Event not registered");
        require(to != address(0), "Invalid recipient");

        tokenId = ++_nextTokenId;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenUri);
        tokenEvent[tokenId] = eventId;

        emit TicketMinted(tokenId, to, eventId, seatNumber);
    }

    /**
     * @notice Batch mint tickets — used for platform pre-mint of inventory.
     * @param eventId    Registered event identifier
     * @param recipients Array of recipient wallets
     * @param seatNumbers Array of seat identifiers (parallel to recipients)
     * @param tokenUris  Array of IPFS metadata URIs (parallel to recipients)
     */
    function batchMint(
        bytes32            eventId,
        address[]  calldata recipients,
        string[]   calldata seatNumbers,
        string[]   calldata tokenUris
    ) external onlyMinter returns (uint256[] memory tokenIds) {
        require(registeredEvents[eventId], "Event not registered");
        require(
            recipients.length == tokenUris.length &&
            recipients.length == seatNumbers.length,
            "Length mismatch"
        );

        tokenIds = new uint256[](recipients.length);
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Invalid recipient");
            uint256 tokenId = ++_nextTokenId;
            _safeMint(recipients[i], tokenId);
            _setTokenURI(tokenId, tokenUris[i]);
            tokenEvent[tokenId] = eventId;
            tokenIds[i] = tokenId;
            emit TicketMinted(tokenId, recipients[i], eventId, seatNumbers[i]);
        }
    }

    // ── ERC-2981 Royalties ────────────────────────────────────────────────────
    function royaltyInfo(uint256, uint256 salePrice)
        external view override
        returns (address receiver, uint256 royaltyAmount)
    {
        return (royaltyRecipient, (salePrice * ROYALTY_BPS) / 10_000);
    }

    function setRoyaltyRecipient(address _recipient) external onlyOwner {
        require(_recipient != address(0), "Invalid address");
        royaltyRecipient = _recipient;
    }

    // ── Minter management ─────────────────────────────────────────────────────
    function addMinter(address minter) external onlyOwner {
        minters[minter] = true;
        emit MinterAdded(minter);
    }

    function removeMinter(address minter) external onlyOwner {
        minters[minter] = false;
        emit MinterRemoved(minter);
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

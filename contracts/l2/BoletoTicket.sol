// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";

/**
 * @title BoletoTicket
 * @notice ERC-721 NFT ticket for a single boleto.eth event. Deployed on Base L2.
 * @dev One contract per event. Owner is the boleto.eth API backend wallet.
 *      Tickets can be soulbound (non-transferable) or transferable — set at deploy,
 *      toggleable by owner. Soulbound blocks all transfers except mint and burn.
 */
contract BoletoTicket is ERC721URIStorage, IERC2981, Ownable {
    using ECDSA for bytes32;

    // ── Structs ───────────────────────────────────────────────────────────────
    struct Seat {
        string seatId;      // e.g. "A-12"
        string section;     // e.g. "VIP"
        string row;
        bool   minted;
        bool   used;        // redeemed at venue — one-way, cannot be unmarked
    }

    // ── State ─────────────────────────────────────────────────────────────────
    mapping(uint256 => Seat)    public seats;
    mapping(string  => uint256) public seatIdToToken;
    mapping(address => bool)    public authorizedRedeemers;

    bytes32  public merkleRoot;      // bytes32(0) = open sale
    address  public splitter;        // RoyaltySplitter address
    string   public ensName;         // e.g. badbunny-miami25.boleto.eth
    uint256  public totalRoyaltyBps; // platform 150 + promoter bps
    bool     public soulbound;       // if true, transfers blocked (except mint/burn)
    uint256  private _nextTokenId;

    // ── Events ────────────────────────────────────────────────────────────────
    event TicketMinted(uint256 indexed tokenId, address indexed to, string seatId);
    event TicketRedeemed(uint256 indexed tokenId, address indexed redeemer);
    event RedeemerAdded(address indexed redeemer);
    event RedeemerRemoved(address indexed redeemer);
    event SoulboundSet(bool soulbound);

    // ── Constructor ───────────────────────────────────────────────────────────
    constructor(
        string memory  name_,
        string memory  symbol_,
        bytes32        _merkleRoot,
        address        _splitter,
        string memory  _ensName,
        uint256        _totalRoyaltyBps,
        bool           _soulbound,
        address        _owner
    ) ERC721(name_, symbol_) Ownable(_owner) {
        require(_splitter != address(0), "Invalid splitter");
        merkleRoot       = _merkleRoot;
        splitter         = _splitter;
        ensName          = _ensName;
        totalRoyaltyBps  = _totalRoyaltyBps;
        soulbound        = _soulbound;
    }

    // ── Soulbound ─────────────────────────────────────────────────────────────

    /**
     * @notice Toggle soulbound status. Only owner can call.
     * @dev Making previously transferable tickets soulbound is a one-way operation
     *      for security — but we allow toggling so the promoter can choose to
     *      unlock transfers after an event (e.g. for resale on secondary markets).
     */
    function setSoulbound(bool _soulbound) external onlyOwner {
        soulbound = _soulbound;
        emit SoulboundSet(_soulbound);
    }

    /**
     * @dev Override _update (OZ v5) to enforce soulbound restriction.
     *      Mints (from == address(0)) and burns (to == address(0)) are always allowed.
     *      Transfers between non-zero addresses are blocked when soulbound.
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        address from = _ownerOf(tokenId);
        if (soulbound && from != address(0) && to != address(0)) {
            revert("Ticket is soulbound: transfers disabled");
        }
        return super._update(to, tokenId, auth);
    }

    // ── Minting ───────────────────────────────────────────────────────────────

    /**
     * @notice Mint a ticket NFT. Called by owner (API backend wallet) after buyer payment.
     * @param to          Buyer wallet address
     * @param seatId      Seat identifier e.g. "A-12"
     * @param section     Section name e.g. "Floor VIP"
     * @param row         Row label e.g. "A"
     * @param tokenUri    IPFS metadata URI for this ticket
     * @param merkleProof Proof for allowlist; ignored if merkleRoot == bytes32(0)
     */
    function mint(
        address         to,
        string calldata seatId,
        string calldata section,
        string calldata row,
        string calldata tokenUri,
        bytes32[] calldata merkleProof
    ) external onlyOwner {
        require(to != address(0), "Invalid recipient");
        require(bytes(seatId).length > 0, "Empty seatId");
        require(seatIdToToken[seatId] == 0, "Seat already minted");

        // Verify merkle proof if root is set
        if (merkleRoot != bytes32(0)) {
            bytes32 leaf = keccak256(abi.encodePacked(to));
            require(MerkleProof.verify(merkleProof, merkleRoot, leaf), "Invalid merkle proof");
        }

        uint256 tokenId = ++_nextTokenId;

        seats[tokenId] = Seat({
            seatId:  seatId,
            section: section,
            row:     row,
            minted:  true,
            used:    false
        });
        seatIdToToken[seatId] = tokenId;

        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenUri);

        emit TicketMinted(tokenId, to, seatId);
    }

    // ── Redemption ────────────────────────────────────────────────────────────

    /**
     * @notice Mark ticket as used (redeemed at venue). One-way — cannot be unmarked.
     * @param tokenId   Token to redeem
     * @param signature keccak256(abi.encodePacked(tokenId, address(this), "redeem")) signed by authorizedRedeemer
     */
    function redeem(uint256 tokenId, bytes calldata signature) external {
        require(_ownerOf(tokenId) != address(0), "Nonexistent token");
        require(!seats[tokenId].used, "Already redeemed");

        bytes32 hash   = keccak256(abi.encodePacked(tokenId, address(this), "redeem"));
        bytes32 digest = MessageHashUtils.toEthSignedMessageHash(hash);
        address signer = ECDSA.recover(digest, signature);
        require(authorizedRedeemers[signer], "Unauthorized redeemer");

        seats[tokenId].used = true;
        emit TicketRedeemed(tokenId, signer);
    }

    // ── Views ─────────────────────────────────────────────────────────────────

    /**
     * @notice Check ticket validity and redemption status.
     */
    function isValid(uint256 tokenId) external view returns (bool valid, bool used) {
        if (_ownerOf(tokenId) == address(0)) return (false, false);
        Seat storage seat = seats[tokenId];
        return (seat.minted, seat.used);
    }

    // ── ERC-2981 ──────────────────────────────────────────────────────────────

    /**
     * @notice Royalty info always returns splitter address — never promoter directly.
     */
    function royaltyInfo(uint256, uint256 salePrice)
        external
        view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        return (splitter, (salePrice * totalRoyaltyBps) / 10_000);
    }

    // ── Admin ─────────────────────────────────────────────────────────────────

    function addRedeemer(address redeemer) external onlyOwner {
        authorizedRedeemers[redeemer] = true;
        emit RedeemerAdded(redeemer);
    }

    function removeRedeemer(address redeemer) external onlyOwner {
        authorizedRedeemers[redeemer] = false;
        emit RedeemerRemoved(redeemer);
    }

    function setMerkleRoot(bytes32 root) external onlyOwner {
        merkleRoot = root;
    }

    // ── ERC-165 ───────────────────────────────────────────────────────────────

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, IERC165)
        returns (bool)
    {
        return interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId);
    }
}

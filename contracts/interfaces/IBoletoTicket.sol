// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IBoletoTicket {
    struct Seat {
        string seatId;
        string section;
        string row;
        bool   minted;
        bool   used;
    }

    function mint(
        address         to,
        string calldata seatId,
        string calldata section,
        string calldata row,
        string calldata tokenUri,
        bytes32[] calldata merkleProof
    ) external;

    function setSoulbound(bool _soulbound) external;

    function soulbound() external view returns (bool);

    function redeem(uint256 tokenId, bytes calldata signature) external;

    function isValid(uint256 tokenId) external view returns (bool valid, bool used);

    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external
        view
        returns (address receiver, uint256 royaltyAmount);

    function seats(uint256 tokenId) external view returns (Seat memory);

    function seatIdToToken(string calldata seatId) external view returns (uint256);

    function authorizedRedeemers(address redeemer) external view returns (bool);

    function addRedeemer(address redeemer) external;

    function removeRedeemer(address redeemer) external;

    function merkleRoot() external view returns (bytes32);

    function splitter() external view returns (address);

    function ensName() external view returns (string memory);
}

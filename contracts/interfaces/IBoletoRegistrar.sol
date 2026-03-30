// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IBoletoRegistrar {
    struct EventRecord {
        address promoter;
        uint256 ticketCount;
        address l2Contract;
        string  ensName;
        bool    active;
    }

    function quoteEvent(uint256 ticketCount) external pure returns (uint256 usdcFee);

    function registerEvent(
        string calldata artistSlug,
        string calldata eventSlug,
        address         promoterWallet,
        uint256         ticketCount,
        string calldata ipfsMetadata
    ) external returns (bytes32 eventId);

    function reserveArtist(string calldata normalizedSlug) external;

    function bulkReserveArtists(string[] calldata normalizedSlugs) external;

    function setL2Contract(bytes32 eventId, address l2Contract) external;

    function getEvent(bytes32 eventId) external view returns (EventRecord memory);
    function events(bytes32 eventId) external view returns (address, uint256, address, string memory, bool);

    function reservedArtists(bytes32 normalizedHash) external view returns (bool);
}

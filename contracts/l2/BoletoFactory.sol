// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./RoyaltySplitter.sol";
import "./BoletoTicket.sol";

/**
 * @title BoletoFactory
 * @notice Deployed once on Base. Atomically deploys a RoyaltySplitter + BoletoTicket
 *         pair for each event. Called by the boleto.eth API backend on payment confirmation.
 * @dev The API wallet is the owner and the only authorized caller of deployEvent.
 *      Emits EventDeployed so the API can read both addresses from a single receipt.
 */
contract BoletoFactory is Ownable {

    address public immutable platform; // boleto.eth treasury — receives platform royalties

    event EventDeployed(
        bytes32 indexed eventId,
        address indexed splitter,
        address indexed ticket
    );

    constructor(address _platform) Ownable(msg.sender) {
        require(_platform != address(0), "Invalid platform address");
        platform = _platform;
    }

    /**
     * @notice Deploy a RoyaltySplitter + BoletoTicket pair for a single event.
     * @param eventId         keccak256 of the full ENS label — must match L1 registrar
     * @param promoter        Promoter wallet address (receives royalty share)
     * @param promoterBps     Promoter secondary royalty in bps (e.g. 250 = 2.5%)
     * @param name            ERC-721 collection name e.g. "Bad Bunny Miami 2025"
     * @param symbol          ERC-721 symbol e.g. "BBM25"
     * @param merkleRoot      Allowlist root — bytes32(0) for open sale
     * @param ensName         Full ENS subdomain e.g. "badbunny-miami25.boleto.eth"
     * @param soulbound       Whether tickets are non-transferable at deploy time
     * @param ticketOwner     Address that will own the BoletoTicket contract (API wallet)
     * @return splitter       Deployed RoyaltySplitter address
     * @return ticket         Deployed BoletoTicket address
     */
    function deployEvent(
        bytes32        eventId,
        address        promoter,
        uint256        promoterBps,
        string calldata name,
        string calldata symbol,
        bytes32        merkleRoot,
        string calldata ensName,
        bool           soulbound,
        address        ticketOwner
    ) external onlyOwner returns (address splitter, address ticket) {
        require(promoter    != address(0), "Invalid promoter");
        require(ticketOwner != address(0), "Invalid ticket owner");
        require(promoterBps > 0 && promoterBps <= 5000, "Invalid promoter bps");

        // Deploy splitter — platformBps is hardcoded to 150 inside RoyaltySplitter
        splitter = address(new RoyaltySplitter(promoter, promoterBps, platform));

        // Total royalty = platform 150 + promoter bps
        uint256 totalRoyaltyBps = 150 + promoterBps;

        // Deploy ticket, owned by the API backend wallet
        ticket = address(new BoletoTicket(
            name,
            symbol,
            merkleRoot,
            splitter,
            ensName,
            totalRoyaltyBps,
            soulbound,
            ticketOwner
        ));

        emit EventDeployed(eventId, splitter, ticket);
    }
}

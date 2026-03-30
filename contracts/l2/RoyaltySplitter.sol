// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title RoyaltySplitter
 * @notice Splits ERC-2981 royalty payments between platform treasury and promoter.
 * @dev Immutable after deployment. platformBps is HARDCODED to 150 — cannot be overridden.
 */
contract RoyaltySplitter {
    address public immutable platform;      // boleto.eth treasury
    address public immutable promoter;      // set at deploy
    uint256 public immutable platformBps;   // ALWAYS 150 (1.5%) — hardcoded
    uint256 public immutable promoterBps;   // set by promoter at event creation

    event Released(address indexed token, uint256 platformShare, uint256 promoterShare);

    constructor(address _promoter, uint256 _promoterBps, address _platform) {
        require(_promoter != address(0), "Invalid promoter");
        require(_platform != address(0), "Invalid platform");
        require(_promoterBps > 0, "Promoter bps must be > 0");

        promoter    = _promoter;
        platform    = _platform;
        platformBps = 150; // HARDCODED — immutable — no constructor override possible
        promoterBps = _promoterBps;
    }

    /**
     * @notice Release accumulated royalties for a given ERC-20 token.
     * @param token ERC-20 token address (e.g. USDC on Base)
     */
    function release(address token) external {
        uint256 balance = IERC20(token).balanceOf(address(this));
        require(balance > 0, "Nothing to release");

        uint256 total          = platformBps + promoterBps;
        uint256 platformShare  = (balance * platformBps) / total;
        uint256 promoterShare  = balance - platformShare;

        IERC20(token).transfer(platform, platformShare);
        IERC20(token).transfer(promoter, promoterShare);

        emit Released(token, platformShare, promoterShare);
    }

    receive() external payable {}
}

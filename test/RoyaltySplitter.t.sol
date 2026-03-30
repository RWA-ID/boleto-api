// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../contracts/l2/RoyaltySplitter.sol";

contract MockERC20 {
    mapping(address => uint256) public balanceOf;
    function mint(address to, uint256 amount) external { balanceOf[to] += amount; }
    function transfer(address to, uint256 amount) external returns (bool) {
        balanceOf[msg.sender] -= amount;
        balanceOf[to] += amount;
        return true;
    }
}

contract RoyaltySplitterTest is Test {
    RoyaltySplitter splitter;
    MockERC20       token;

    address platform = address(0x1111);
    address promoter = address(0x2222);
    uint256 promoterBps = 250; // 2.5%

    function setUp() public {
        token    = new MockERC20();
        splitter = new RoyaltySplitter(promoter, promoterBps, platform);
    }

    function test_platformBpsAlways150() public view {
        assertEq(splitter.platformBps(), 150);
    }

    function test_promoterBpsSetCorrectly() public view {
        assertEq(splitter.promoterBps(), promoterBps);
    }

    function test_immutableAddresses() public view {
        assertEq(splitter.platform(), platform);
        assertEq(splitter.promoter(), promoter);
    }

    function test_releaseCorrectSplit() public {
        uint256 amount = 1_000_000; // 1 USDC
        token.mint(address(splitter), amount);

        splitter.release(address(token));

        uint256 total         = 150 + 250; // 400 bps
        uint256 expectedPlat  = (amount * 150) / total; // 375_000
        uint256 expectedProm  = amount - expectedPlat;  // 625_000

        assertEq(token.balanceOf(platform), expectedPlat);
        assertEq(token.balanceOf(promoter), expectedProm);
    }

    function test_releaseRevertsWhenEmpty() public {
        vm.expectRevert("Nothing to release");
        splitter.release(address(token));
    }

    function test_cannotOverridePlatformBps() public {
        // Deploy with any value — platformBps must still be 150
        RoyaltySplitter s2 = new RoyaltySplitter(promoter, 9999, platform);
        assertEq(s2.platformBps(), 150);
    }

    function test_releaseEmitsEvent() public {
        uint256 amount = 400_000;
        token.mint(address(splitter), amount);

        uint256 total        = 150 + 250;
        uint256 platShare    = (amount * 150) / total;
        uint256 promShare    = amount - platShare;

        vm.expectEmit(true, false, false, true);
        emit RoyaltySplitter.Released(address(token), platShare, promShare);
        splitter.release(address(token));
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import "../src/mocks/MockIDR.sol";

/**
 * @title MintMockIDR
 * @dev Script to mint mIDR tokens to deployer address
 */
contract MintMockIDR is Script {
    // Existing MockIDR address on Hedera testnet
    address constant MOCK_IDR_ADDRESS = 0xd7d78C1758f4c26a166d06B7137D0123B9fd15f6;

    function run() public {
        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));
        
        // Amount to mint: 100 juta dengan 2 decimal
        // 100,000,000 * 10^2 = 10,000,000,000 (100 juta dalam smallest unit)
        uint256 mintAmount = 100_000_000e2; // 100 juta mIDR dengan 2 decimal
        
        console.log("=== MINTING mIDR TOKENS ===");
        console.log("MockIDR address:", MOCK_IDR_ADDRESS);
        console.log("Deployer address:", deployer);
        console.log("Amount to mint:", mintAmount / 1e2, "mIDR");
        
        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        
        // Connect to existing MockIDR contract
        MockIDR mockIDR = MockIDR(MOCK_IDR_ADDRESS);
        
        // Check current balance
        uint256 balanceBefore = mockIDR.balanceOf(deployer);
        console.log("Balance before:", balanceBefore / 1e2, "mIDR");
        
        // Mint tokens to deployer
        console.log("\nMinting", mintAmount / 1e2, "mIDR to deployer...");
        mockIDR.mint(deployer, mintAmount);
        
        // Check balance after
        uint256 balanceAfter = mockIDR.balanceOf(deployer);
        console.log("Balance after:", balanceAfter / 1e2, "mIDR");
        
        vm.stopBroadcast();
        
        console.log("\n=== MINTING SUCCESSFUL ===");
        console.log("Minted:", mintAmount / 1e2, "mIDR");
        console.log("Total balance:", balanceAfter / 1e2, "mIDR");
    }
}

// DEPLOYMENT:
// forge script script/MintMockIDR.s.sol:MintMockIDR --rpc-url testnet --broadcast -vvvv


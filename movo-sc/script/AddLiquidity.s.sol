// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import "../src/InvoicePayment.sol";
import "../src/mocks/MockIDR.sol";

/**
 * @title AddLiquidity
 * @dev Script to add mIDR liquidity to InvoicePayment contract
 */
contract AddLiquidity is Script {
    // Contract addresses on Hedera testnet
    address constant INVOICE_PAYMENT_ADDRESS = 0x7fF8CdCCDa11fE2767fAc29ae50867805D9e04b1;
    address constant MOCK_IDR_ADDRESS = 0xd7d78C1758f4c26a166d06B7137D0123B9fd15f6;

    function run() public {
        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));
        
        // Amount to add as liquidity (5M mIDR dengan 2 decimal)
        uint256 liquidityAmount = 5_000_000e2;
        
        console.log("=== ADDING mIDR LIQUIDITY ===");
        console.log("InvoicePayment address:", INVOICE_PAYMENT_ADDRESS);
        console.log("MockIDR address:", MOCK_IDR_ADDRESS);
        console.log("Deployer address:", deployer);
        console.log("Liquidity amount:", liquidityAmount / 1e2, "mIDR");
        
        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        
        // Connect to contracts
        InvoicePayment invoicePayment = InvoicePayment(INVOICE_PAYMENT_ADDRESS);
        MockIDR mockIDR = MockIDR(MOCK_IDR_ADDRESS);
        
        // Check deployer balance
        uint256 balanceBefore = mockIDR.balanceOf(deployer);
        console.log("\nDeployer mIDR balance before:", balanceBefore / 1e2, "mIDR");
        
        // Check if deployer has enough balance
        require(balanceBefore >= liquidityAmount, "Insufficient mIDR balance");
        
        // Check current contract liquidity
        uint256 liquidityBefore = invoicePayment.getMIDRLiquidity();
        console.log("Contract liquidity before:", liquidityBefore / 1e2, "mIDR");
        
        // Approve InvoicePayment to spend mIDR
        console.log("\nApproving InvoicePayment to spend mIDR...");
        mockIDR.approve(INVOICE_PAYMENT_ADDRESS, liquidityAmount);
        console.log("Approval successful");
        
        // Add liquidity to contract
        console.log("\nAdding liquidity to InvoicePayment contract...");
        invoicePayment.addLiquidity(liquidityAmount);
        console.log("Liquidity added successfully!");
        
        // Check balances after
        uint256 balanceAfter = mockIDR.balanceOf(deployer);
        uint256 liquidityAfter = invoicePayment.getMIDRLiquidity();
        
        console.log("\n=== TRANSACTION SUMMARY ===");
        console.log("Deployer mIDR balance after:", balanceAfter / 1e2, "mIDR");
        console.log("Contract liquidity after:", liquidityAfter / 1e2, "mIDR");
        console.log("Liquidity added:", liquidityAmount / 1e2, "mIDR");
        
        vm.stopBroadcast();
        
        console.log("\n=== SUCCESS ===");
        console.log("mIDR liquidity successfully added to InvoicePayment contract!");
    }
}

// USAGE:
// 1. Set environment variables:
//    export PRIVATE_KEY=your_private_key
//    export HEDERA_RPC_URL=your_rpc_url
//
// 2. Run:
//    forge script script/AddLiquidity.s.sol:AddLiquidity --rpc-url testnet --broadcast -vvvv


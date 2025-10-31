// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import "../src/InvoicePayment.sol";

/**
 * @title DeployInvoicePayment
 * @dev Deployment script for InvoicePayment contract with X402 payment system
 */
contract DeployInvoicePayment is Script {
    InvoicePayment public invoicePayment;
    
    // Existing MockIDR address on Hedera testnet
    address constant MOCK_IDR_ADDRESS = 0xd7d78C1758f4c26a166d06B7137D0123B9fd15f6;

    function run() public {
        
        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));
        address backend = vm.addr(vm.envUint("PRIVATE_KEY")); // Use same address for simplicity
        
        // USDC address on Hedera testnet (official USDC)
        address usdcAddress = 0x0000000000000000000000000000000000068cDa;
        
        console.log("=== DEPLOYING MOVO PAYMENT SYSTEM ===");
        console.log("Deployer address:", deployer);
        console.log("Backend address:", backend);
        console.log("USDC address (Hedera testnet):", usdcAddress);
        console.log("MockIDR address (EXISTING):", MOCK_IDR_ADDRESS);
        console.log("Deployer ETH balance:", deployer.balance / 1e18, "ETH");
        console.log("Block number:", block.number);
        
        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        
        // Deploy InvoicePayment contract
        console.log("\n[1/2] Deploying InvoicePayment contract...");
        invoicePayment = new InvoicePayment(
            usdcAddress,                // USDC address on Hedera testnet
            MOCK_IDR_ADDRESS,           // mIDR address (existing)
            backend                     // Backend address (same as deployer)
        );
        console.log("InvoicePayment deployed at:", address(invoicePayment));
        
        vm.stopBroadcast();
        
        // Display deployment summary
        console.log("\n[2/2] Deployment Summary");
        console.log("==================================================");
        console.log("InvoicePayment address:", address(invoicePayment));
        console.log("MockIDR address:", MOCK_IDR_ADDRESS);
        console.log("USDC address:", usdcAddress);
        console.log("Backend address:", backend);
        console.log("Deployment block:", block.number);
        console.log("==================================================");
        
        // Verify deployment
        require(address(invoicePayment) != address(0), "InvoicePayment deployment failed");
        console.log("\n[OK] Contract verification: PASSED");
        
        // Test contract configuration
        console.log("\n=== CONTRACT CONFIGURATION ===");
        console.log("Exchange rate: 1 USDC =", invoicePayment.getExchangeRate(), "mIDR");
        
        // Test swap calculation
        console.log("\n=== SWAP TEST (100 USDC) ===");
        uint256 testAmount = 100 * 10**6; // 100 USDC
        uint256 calculatedMIDR = invoicePayment.calculateMIDRAmount(testAmount);
        console.log("Input: 100 USDC");
        console.log("Output:", calculatedMIDR / 1e2, "mIDR");
        console.log("Rate:", calculatedMIDR / 1e2 / 100, "mIDR per USDC");
        
        // Environment variables for backend
        console.log("\n=== BACKEND ENVIRONMENT VARIABLES ===");
        console.log("Add these to your .env file:");
        console.log("CONTRACT_ADDRESS=", address(invoicePayment));
        console.log("MIDR_TOKEN_ADDRESS=", MOCK_IDR_ADDRESS);
        console.log("USDC_TOKEN_ADDRESS=", usdcAddress);
        console.log("BACKEND_WALLET_ADDRESS=", backend);
    }
}

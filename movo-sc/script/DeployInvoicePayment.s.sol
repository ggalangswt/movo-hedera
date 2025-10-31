// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import "../src/InvoicePayment.sol";
import "../src/mocks/MockIDR.sol";

/**
 * @title DeployInvoicePayment
 * @dev Deployment script for InvoicePayment contract with X402 payment system
 */
contract DeployInvoicePayment is Script {
    InvoicePayment public invoicePayment;
    MockIDR public mockIDR;

    function run() public {
        
        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));
        address backend = vm.addr(vm.envUint("PRIVATE_KEY")); // Use same address for simplicity
        
        // USDC address on Base Sepolia (official USDC)
        address usdcAddress = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
        
        console.log("=== DEPLOYING MOVO PAYMENT SYSTEM ===");
        console.log("Deployer address:", deployer);
        console.log("Backend address:", backend);
        console.log("USDC address (Base Sepolia):", usdcAddress);
        console.log("Deployer ETH balance:", deployer.balance / 1e18, "ETH");
        console.log("Block number:", block.number);
        
        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        
        // 1. Deploy MockIDR token
        console.log("\n[1/4] Deploying MockIDR token...");
        mockIDR = new MockIDR();
        console.log("MockIDR deployed at:", address(mockIDR));
        console.log("Initial mIDR supply:", mockIDR.balanceOf(deployer) / 1e2, "mIDR");
        
        // 2. Deploy InvoicePayment contract
        console.log("\n[2/4] Deploying InvoicePayment contract...");
        invoicePayment = new InvoicePayment(
            usdcAddress,                // USDC address on Base Sepolia
            address(mockIDR),           // mIDR address (just deployed)
            backend                     // Backend address (same as deployer)
        );
        console.log("InvoicePayment deployed at:", address(invoicePayment));
        
        // 3. Add mIDR liquidity to contract for swaps
        console.log("\n[3/4] Adding mIDR liquidity to contract...");
        uint256 liquidityAmount = 5_000_000e2; // 5M mIDR liquidity for swaps
        mockIDR.approve(address(invoicePayment), liquidityAmount);
        invoicePayment.addLiquidity(liquidityAmount);
        console.log("Added liquidity:", liquidityAmount / 1e2, "mIDR");
        console.log("Contract mIDR balance:", invoicePayment.getMIDRLiquidity() / 1e2, "mIDR");
        
        vm.stopBroadcast();
        
        // 4. Display deployment summary
        console.log("\n[4/4] Deployment Summary");
        console.log("==================================================");
        console.log("InvoicePayment address:", address(invoicePayment));
        console.log("MockIDR address:", address(mockIDR));
        console.log("USDC address:", usdcAddress);
        console.log("Backend address:", backend);
        console.log("Deployment block:", block.number);
        console.log("==================================================");
        
        // Verify deployment
        require(address(invoicePayment) != address(0), "InvoicePayment deployment failed");
        require(address(mockIDR) != address(0), "MockIDR deployment failed");
        console.log("\n[OK] Contract verification: PASSED");
        
        // Test contract configuration
        console.log("\n=== CONTRACT CONFIGURATION ===");
        console.log("Exchange rate: 1 USDC =", invoicePayment.getExchangeRate(), "mIDR");
        console.log("mIDR liquidity:", invoicePayment.getMIDRLiquidity() / 1e2, "mIDR");
        console.log("USDC balance:", invoicePayment.getUSDCBalance() / 1e6, "USDC");
        
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
        console.log("MIDR_TOKEN_ADDRESS=", address(mockIDR));
        console.log("USDC_TOKEN_ADDRESS=", usdcAddress);
        console.log("BACKEND_WALLET_ADDRESS=", backend);
    }
}

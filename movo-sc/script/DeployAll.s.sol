// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import "../src/InvoicePayment.sol";
import "../src/mocks/MockIDR.sol";

/**
 * @title DeployAll
 * @dev Deployment script for InvoicePayment using EXISTING MockIDR token
 * @dev MockIDR already deployed at: 0x4ED137bc2369ea4c3BFD2f77171d02a45F7eFBf0
 */
contract DeployAll is Script {
    InvoicePayment public invoicePayment;
    MockIDR public mockIDR;

    function run() public {
        
        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));
        address backend = deployer; // Use same address for backend
        
        // EXISTING MockIDR address on Base Sepolia
        address midrAddress = 0x4ED137bc2369ea4c3BFD2f77171d02a45F7eFBf0;
        
        // Official USDC address on Base Sepolia
        address usdcAddress = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;
        
        console.log("=== DEPLOYING MOVO PAYMENT SYSTEM ===");
        console.log("Deployer address:", deployer);
        console.log("Backend address:", backend);
        console.log("USDC address (Base Sepolia):", usdcAddress);
        console.log("MockIDR address (EXISTING):", midrAddress);
        console.log("Deployer ETH balance:", deployer.balance / 1e18, "ETH");
        console.log("Block number:", block.number);
        
        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        
        // Connect to existing MockIDR
        mockIDR = MockIDR(midrAddress);
        console.log("\n[1/3] Connected to existing MockIDR at:", address(mockIDR));
        console.log("Deployer mIDR balance:", mockIDR.balanceOf(deployer) / 1e2, "mIDR");
        
        // Deploy InvoicePayment contract
        console.log("\n[2/3] Deploying InvoicePayment contract...");
        invoicePayment = new InvoicePayment(
            usdcAddress,                // USDC address on Base Sepolia
            midrAddress,                // MockIDR address (existing)
            backend                     // Backend address (same as deployer)
        );
        console.log("InvoicePayment deployed at:", address(invoicePayment));
        
        // Add mIDR liquidity to contract for swaps
        console.log("\n[3/3] Adding mIDR liquidity to contract...");
        uint256 liquidityAmount = 5_000_000e2; // 5M mIDR liquidity for swaps
        uint256 availableBalance = mockIDR.balanceOf(deployer);
        
        console.log("Available mIDR balance:", availableBalance / 1e2, "mIDR");
        console.log("Liquidity to add:", liquidityAmount / 1e2, "mIDR");
        
        if (availableBalance >= liquidityAmount) {
            mockIDR.approve(address(invoicePayment), liquidityAmount);
            invoicePayment.addLiquidity(liquidityAmount);
            console.log("[OK] Added liquidity:", liquidityAmount / 1e2, "mIDR");
            console.log("[OK] Contract mIDR balance:", invoicePayment.getMIDRLiquidity() / 1e2, "mIDR");
        } else {
            console.log("[WARNING] Insufficient mIDR balance for full liquidity");
            console.log("[WARNING] Available:", availableBalance / 1e2, "mIDR");
            console.log("[WARNING] Needed:", liquidityAmount / 1e2, "mIDR");
            
            if (availableBalance > 0) {
                console.log("Adding available balance instead...");
                mockIDR.approve(address(invoicePayment), availableBalance);
                invoicePayment.addLiquidity(availableBalance);
                console.log("[OK] Added liquidity:", availableBalance / 1e2, "mIDR");
            }
        }
        
        vm.stopBroadcast();
        
        // Display deployment summary
        console.log("\n=== DEPLOYMENT SUCCESSFUL ===");
        console.log("==================================================");
        console.log("InvoicePayment:", address(invoicePayment));
        console.log("MockIDR:", midrAddress);
        console.log("USDC:", usdcAddress);
        console.log("Backend:", backend);
        console.log("Deployment block:", block.number);
        console.log("==================================================");
        
        // Verify deployment
        require(address(invoicePayment) != address(0), "InvoicePayment deployment failed");
        console.log("\n[OK] Contract verification: PASSED");
        
        // Test contract configuration
        console.log("\n=== CONTRACT CONFIGURATION ===");
        console.log("Exchange rate: 1 USDC =", invoicePayment.getExchangeRate(), "mIDR");
        console.log("mIDR liquidity:", invoicePayment.getMIDRLiquidity() / 1e2, "mIDR");
        console.log("USDC balance:", invoicePayment.getUSDCBalance() / 1e6, "USDC");
        console.log("Total invoices:", invoicePayment.totalInvoices());
        
        // Test swap calculation
        console.log("\n=== SWAP TEST ===");
        console.log("10 USDC ->", invoicePayment.calculateMIDRAmount(10 * 10**6) / 1e2, "mIDR");
        console.log("100 USDC ->", invoicePayment.calculateMIDRAmount(100 * 10**6) / 1e2, "mIDR");
        console.log("1000 USDC ->", invoicePayment.calculateMIDRAmount(1000 * 10**6) / 1e2, "mIDR");
        
        // Environment variables for backend
        console.log("\n=== COPY THESE TO BACKEND .env ===");
        console.log("CONTRACT_ADDRESS=", address(invoicePayment));
        console.log("MIDR_TOKEN_ADDRESS=", midrAddress);
        console.log("USDC_TOKEN_ADDRESS=", usdcAddress);
        console.log("BACKEND_WALLET_ADDRESS=", backend);
        console.log("X402_NETWORK=base-sepolia");
        console.log("==================================================");
    }
}

// DEPLOYMENT COMMAND:
// forge script script/DeployAll.s.sol:DeployAll --rpc-url $BASE_SEPOLIA_RPC_URL --broadcast --verify -vvvv

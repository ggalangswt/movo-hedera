// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import "../src/InvoicePayment.sol";
import "../src/mocks/MockIDR.sol";

/**
 * @title DeployWithOfficialUSDC
 * @dev Deployment script for InvoicePayment contract with official USDC on Base Sepolia
 * @dev This script uses the official USDC contract address on Base Sepolia
 */
contract DeployWithOfficialUSDC is Script {
    InvoicePayment public invoicePayment;
    MockIDR public mockIDR;

    // Official USDC address on Base Sepolia testnet
    address constant USDC_BASE_SEPOLIA = 0x036CbD53842c5426634e7929541eC2318f3dCF7e;

    function run() public {
        // Fork Base Sepolia for testing
        vm.createSelectFork(vm.rpcUrl("base_sepolia"));
        
        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));
        address backend = vm.addr(vm.envUint("PRIVATE_KEY")); // Use same address for simplicity
        
        console.log("Deploying InvoicePayment contract with official USDC...");
        console.log("Deployer address:", deployer);
        console.log("Backend address:", backend);
        console.log("USDC address (Base Sepolia):", USDC_BASE_SEPOLIA);
        console.log("Deployer balance:", deployer.balance);
        console.log("Block number:", block.number);
        
        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        
        // Deploy MockIDR (for testing - in production this would be a real IDR token)
        console.log("Deploying MockIDR...");
        mockIDR = new MockIDR();
        console.log("MockIDR deployed at:", address(mockIDR));
        
        // Deploy InvoicePayment contract with official USDC
        console.log("Deploying InvoicePayment...");
        invoicePayment = new InvoicePayment(
            USDC_BASE_SEPOLIA,  // Official USDC address on Base Sepolia
            address(mockIDR),   // mIDR address
            backend             // Backend address
        );
        
        vm.stopBroadcast();
        
        console.log("=== DEPLOYMENT SUCCESSFUL ===");
        console.log("address public invoicePayment =", address(invoicePayment), ";");
        console.log("address public mockIDR =", address(mockIDR), ";");
        console.log("address public USDC =", USDC_BASE_SEPOLIA, ";");
        console.log("Contract deployed at:", address(invoicePayment));
        console.log("Deployment block:", block.number);
        
        // Verify deployment
        require(address(invoicePayment) != address(0), "InvoicePayment deployment failed");
        require(address(mockIDR) != address(0), "MockIDR deployment failed");
        console.log("Contract verification: PASSED");
        
        // Test basic functionality
        console.log("=== TESTING DEPLOYED CONTRACT ===");
        console.log("Total invoices:", invoicePayment.totalInvoices());
        console.log("Total paid invoices:", invoicePayment.totalPaidInvoices());
        console.log("Total settled invoices:", invoicePayment.totalSettledInvoices());
        console.log("USDC address:", invoicePayment.USDC_ADDRESS());
        console.log("mIDR address:", invoicePayment.MIDR_ADDRESS());
        console.log("Backend address:", invoicePayment.backendAddress());
        console.log("Exchange rate (1 USDC = X mIDR):", invoicePayment.getExchangeRate());
        
        // Test mIDR calculation
        uint256 testAmount = 100 * 10**6; // 100 USDC
        uint256 calculatedMIDR = invoicePayment.calculateMIDRAmount(testAmount);
        console.log("100 USDC =", calculatedMIDR / 1e2, "mIDR");
        
        // Deposit some mIDR to contract for settlement testing
        console.log("Depositing mIDR to contract for settlement...");
        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        mockIDR.transfer(address(invoicePayment), 1000000e2); // 1M mIDR (2 decimals)
        vm.stopBroadcast();
        console.log("mIDR deposited to contract for settlement testing");
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import "../src/InvoicePayment.sol";
interface IMockIDR {
    function mint(address to, uint256 amount) external;
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
    function allowance(address owner, address spender) external view returns (uint256);
}

contract SetupInvoicePayment is Script {
    // Contract addresses (fill these after deployment)
    address public constant INVOICE_PAYMENT = 0x7a6FaDce6c75E4BA8d2d0b0cF30c73A8dbF9c93b;
    address public constant MIDR = 0x4ED137bc2369ea4c3BFD2f77171d02a45F7eFBf0;
    
    uint256 public constant DEPOSIT_AMOUNT = 10000000000000e2;

    function run() public {
        // Get deployer address
        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));
        console.log("Deployer address:", deployer);
        
        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));

        // Get contract instances
        IMockIDR midr = IMockIDR(MIDR);
        InvoicePayment invoicePayment = InvoicePayment(INVOICE_PAYMENT);

        // 1. Mint mIDR to deployer
        console.log("Minting mIDR to deployer...");
        console.log("Initial mIDR balance:", midr.balanceOf(deployer));
        midr.mint(deployer, DEPOSIT_AMOUNT);
        console.log("After mint mIDR balance:", midr.balanceOf(deployer));

        // 2. Approve InvoicePayment to spend mIDR
        console.log("Approving InvoicePayment to spend mIDR...");
        midr.approve(INVOICE_PAYMENT, DEPOSIT_AMOUNT);
        console.log("Approved amount:", midr.allowance(deployer, INVOICE_PAYMENT));

        // 3. Deposit mIDR to InvoicePayment
        console.log("Depositing mIDR to InvoicePayment...");
        console.log("Initial contract mIDR balance:", midr.balanceOf(INVOICE_PAYMENT));
        invoicePayment.depositMIDR(DEPOSIT_AMOUNT);
        console.log("Final contract mIDR balance:", midr.balanceOf(INVOICE_PAYMENT));

        vm.stopBroadcast();
        
        console.log("=== SETUP COMPLETE ===");
        console.log("mIDR deposited:", DEPOSIT_AMOUNT);
        console.log("InvoicePayment can now settle up to:", DEPOSIT_AMOUNT / 16600, "USDC worth of invoices");
    }
}
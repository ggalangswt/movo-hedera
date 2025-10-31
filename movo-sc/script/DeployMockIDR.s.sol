// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import "../src/mocks/MockIDR.sol";

/**
 * @title DeployMockIDR
 * @dev Deployment script for MockIDR with initial supply minting
 */
contract DeployMockIDR is Script {
    MockIDR public mockIDR;

    function run() public {

        address deployer = vm.addr(vm.envUint("PRIVATE_KEY"));
        uint256 initialSupply = 9_000_000e2;

        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        
        // Deploy Mock IDR
        mockIDR = new MockIDR();
        console.log("MockIDR deployed to:", address(mockIDR));
        
        // Mint initial supply to deployer
        mockIDR.mint(deployer, initialSupply);
        console.log("Minted", initialSupply / 10e2, "MIDR to:", deployer);
        
        vm.stopBroadcast();
        
        console.log("\n=== DEPLOYMENT SUMMARY ===");
        console.log("MockIDR address:", address(mockIDR));
        console.log("Deployer address:", deployer);
        console.log("Initial supply:", initialSupply / 10**18, "MIDR");
        console.log("Deployment block:", block.number);
        
        // Verification information
        console.log("\n=== VERIFICATION COMMAND ===");
        console.log("forge verify-contract", address(mockIDR), "MockIDR", "--chain-id 296 --watch");
    }
}


// DEPLOYMENT:
// 1. Set environment variables:
//    export PRIVATE_KEY=your_private_key
//    export HEDERA_RPC_URL=your_rpc_url
//    export ETHERSCAN_API_KEY=your_etherscan_api_key

// 2. Deploy:
//    forge script script/DeployMockIDR.s.sol:DeployMockIDR --rpc-url testnet --broadcast -vvvv
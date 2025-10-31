// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MockIDR
 * @dev Mock IDR token for testing cross-border payment settlement
 * @dev Represents Indonesian Rupiah equivalent for testing purposes
 * @author Your Name
 */
contract MockIDR is ERC20, Ownable {
    // ============ STATE VARIABLES ============
    
    uint256 public constant INITIAL_SUPPLY = 1000000e2; // 1B mIDR for testing (2 decimals)
    
    // ============ EVENTS ============
    
    /**
     * @dev Emitted when tokens are minted
     * @param to Address that received the tokens
     * @param amount Amount of tokens minted
     */
    event TokensMinted(address indexed to, uint256 amount);
    
    /**
     * @dev Emitted when tokens are burned
     * @param from Address that had tokens burned
     * @param amount Amount of tokens burned
     */
    event TokensBurned(address indexed from, uint256 amount);

    // ============ CONSTRUCTOR ============
    
    constructor() ERC20("Mock Indonesian Rupiah", "mIDR") Ownable(msg.sender) {
        _mint(msg.sender, INITIAL_SUPPLY);
        emit TokensMinted(msg.sender, INITIAL_SUPPLY);
    }
    
    // ============ OVERRIDES ============
    
    /**
     * @dev Returns the number of decimals used to get its user representation
     * @return Number of decimals
     */
    function decimals() public pure override returns (uint8) {
        return 2;
    }
    
    // ============ MINTING FUNCTIONS ============
    
    /**
     * @dev Mint tokens to a specific address (only owner)
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than zero");
        
        _mint(to, amount);
        emit TokensMinted(to, amount);
    }
    
    /**
     * @dev Mint tokens to multiple addresses (only owner)
     * @param recipients Array of addresses to mint tokens to
     * @param amounts Array of amounts to mint to each address
     */
    function mintBatch(address[] calldata recipients, uint256[] calldata amounts) external onlyOwner {
        require(recipients.length == amounts.length, "Arrays length mismatch");
        require(recipients.length > 0, "Empty arrays");
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Cannot mint to zero address");
            require(amounts[i] > 0, "Amount must be greater than zero");
            
            _mint(recipients[i], amounts[i]);
            emit TokensMinted(recipients[i], amounts[i]);
        }
    }
    
    // ============ BURNING FUNCTIONS ============
    
    /**
     * @dev Burn tokens from a specific address (only owner)
     * @param from Address to burn tokens from
     * @param amount Amount of tokens to burn
     */
    function burn(address from, uint256 amount) external onlyOwner {
        require(from != address(0), "Cannot burn from zero address");
        require(amount > 0, "Amount must be greater than zero");
        require(balanceOf(from) >= amount, "Insufficient balance to burn");
        
        _burn(from, amount);
        emit TokensBurned(from, amount);
    }
    
    /**
     * @dev Allow users to burn their own tokens
     * @param amount Amount of tokens to burn
     */
    function burnSelf(uint256 amount) external {
        require(amount > 0, "Amount must be greater than zero");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance to burn");
        
        _burn(msg.sender, amount);
        emit TokensBurned(msg.sender, amount);
    }
    
    // ============ UTILITY FUNCTIONS ============
    
    /**
     * @dev Get the current total supply
     * @return Current total supply
     */
    function getTotalSupply() external view returns (uint256) {
        return totalSupply();
    }
    
}

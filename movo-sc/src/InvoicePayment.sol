// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title InvoicePayment
 * @dev A contract for handling cross-border payments using X402 payment protocol
 * @dev Backend handles x402 payment flow, smart contract handles USDC to mIDR settlement
 * @dev Smart contract acts as settlement layer only, not payment processor
 * @author Your Name
 */
contract InvoicePayment is Ownable {
    // ============ STRUCTS ============
    
    /**
     * @dev Invoice structure containing all necessary payment information
     */
    struct Invoice {
        address merchant;           // Address of the merchant who created the invoice
        uint256 amountUSDC;         // Amount in USDC (6 decimals)
        bool paid;                  // Payment status (confirmed by backend)
        bool settled;               // Settlement status (mIDR transferred)
        uint256 createdAt;          // Timestamp when invoice was created
        uint256 paidAt;             // Timestamp when invoice was marked as paid
        uint256 settledAt;          // Timestamp when invoice was settled
    }

    // ============ STATE VARIABLES ============
    
    mapping(string => Invoice) public invoices;           // Mapping from invoiceId to Invoice struct
    mapping(address => string[]) public merchantInvoices; // Mapping from merchant address to their invoice IDs
    
    uint256 public totalInvoices;                         // Total number of invoices created
    uint256 public totalPaidInvoices;                     // Total number of paid invoices
    uint256 public totalSettledInvoices;                  // Total number of settled invoices
    
    // X402 Payment Configuration
    address public immutable USDC_ADDRESS;                // Official USDC address on Hedera testnet
    address public immutable MIDR_ADDRESS;                // Mock IDR token address
    uint256 public constant USDC_TO_MIDR_RATE = 16600;    // 1 USDC = 16600 mIDR (fixed rate)
    uint256 public constant USDC_DECIMALS = 6;            // USDC has 6 decimals
    uint256 public constant MIDR_DECIMALS = 2;            // mIDR has 2 decimals
    
    // Backend address for payment confirmation
    address public backendAddress;

    // ============ EVENTS ============
    
    /**
     * @dev Emitted when a new invoice is created
     * @param invoiceId Unique identifier for the invoice
     * @param merchant Address of the merchant who created the invoice
     * @param amountUSDC Amount in USDC
     */
    event InvoiceCreated(
        string indexed invoiceId,
        address indexed merchant,
        uint256 amountUSDC
    );
    
    /**
     * @dev Emitted when an invoice is marked as paid by backend
     * @param invoiceId Unique identifier for the invoice
     * @param payer Address of the payer (from X402 payment)
     */
    event InvoicePaid(
        string indexed invoiceId,
        address indexed payer
    );
    
    /**
     * @dev Emitted when an invoice is settled with mIDR
     * @param invoiceId Unique identifier for the invoice
     * @param merchant Address of the merchant who received mIDR
     * @param amountMIDR Amount in mIDR transferred
     */
    event InvoiceSettled(
        string indexed invoiceId,
        address indexed merchant,
        uint256 amountMIDR
    );

    // ============ MODIFIERS ============
    
    /**
     * @dev Modifier to ensure invoice exists
     * @param _invoiceId The invoice ID to check
     */
    modifier invoiceExists(string memory _invoiceId) {
        require(invoices[_invoiceId].merchant != address(0), "Invoice does not exist");
        _;
    }
    
    /**
     * @dev Modifier to ensure only backend can call
     */
    modifier onlyBackend() {
        require(msg.sender == backendAddress, "Only backend can call this function");
        _;
    }

    // ============ CONSTRUCTOR ============
    
    /**
     * @dev Constructor sets USDC address, mIDR address, and initial owner
     * @param _usdcAddress Official USDC address on Hedera testnet
     * @param _midrAddress Mock IDR token address
     * @param _backendAddress Backend address for payment confirmation
     */
    constructor(
        address _usdcAddress,
        address _midrAddress,
        address _backendAddress
    ) Ownable(msg.sender) {
        require(_usdcAddress != address(0), "Invalid USDC address");
        require(_midrAddress != address(0), "Invalid mIDR address");
        require(_backendAddress != address(0), "Invalid backend address");
        
        USDC_ADDRESS = _usdcAddress;
        MIDR_ADDRESS = _midrAddress;
        backendAddress = _backendAddress;
    }

    // ============ EXTERNAL FUNCTIONS ============
    
    /**
     * @dev Creates a new invoice (can be called by anyone)
     * @dev Backend will call this after creating invoice with customer details
     * @param _merchant Address of the merchant who will receive payment
     * @param _amountUSDC Amount in USDC (6 decimals) - already converted from IDR by backend
     * @param _invoiceId Unique identifier for the invoice
     */
    function createInvoice(
        address _merchant,
        uint256 _amountUSDC,
        string memory _invoiceId
    ) external {
        // Validate inputs
        require(_merchant != address(0), "Invalid merchant address");
        require(_amountUSDC > 0, "Amount must be greater than zero");
        require(bytes(_invoiceId).length > 0, "Invoice ID cannot be empty");
        require(invoices[_invoiceId].merchant == address(0), "Invoice ID already exists");
        
        // Create new invoice
        Invoice memory newInvoice = Invoice({
            merchant: _merchant,
            amountUSDC: _amountUSDC,
            paid: false,
            settled: false,
            createdAt: block.timestamp,
            paidAt: 0,
            settledAt: 0
        });
        
        // Store invoice
        invoices[_invoiceId] = newInvoice;
        merchantInvoices[_merchant].push(_invoiceId);
        
        // Update counters
        totalInvoices++;
        
        // Emit event
        emit InvoiceCreated(_invoiceId, _merchant, _amountUSDC);
    }
    
    /**
     * @dev Marks an invoice as paid (only backend can call after X402 payment confirmation)
     * @param _invoiceId Unique identifier for the invoice
     * @param _payer Address of the payer from X402 payment
     */
    function markAsPaid(
        string memory _invoiceId,
        address _payer
    ) external onlyBackend invoiceExists(_invoiceId) {
        Invoice storage invoice = invoices[_invoiceId];
        
        require(!invoice.paid, "Invoice already paid");
        
        // Update invoice status
        invoice.paid = true;
        invoice.paidAt = block.timestamp;
        
        // Update counters
        totalPaidInvoices++;
        
        // Emit event
        emit InvoicePaid(_invoiceId, _payer);
    }
    
    /**
     * @dev Settles an invoice by transferring mIDR to merchant (only backend can call)
     * @dev This function handles the complete X402 payment flow: USDC payment → mIDR settlement
     * @param _invoiceId Unique identifier for the invoice
     */
    function settleInvoice(string memory _invoiceId) external onlyBackend invoiceExists(_invoiceId) {
        Invoice storage invoice = invoices[_invoiceId];
        
        require(invoice.paid, "Invoice must be paid before settlement");
        require(!invoice.settled, "Invoice already settled");
        
        // Calculate mIDR amount
        // Convert USDC amount to mIDR using fixed rate
        // USDC has 6 decimals, mIDR has 2 decimals
        // amountUSDC * USDC_TO_MIDR_RATE * (10^2 / 10^6) = amountUSDC * USDC_TO_MIDR_RATE / 10^4
        uint256 amountMIDR = invoice.amountUSDC * USDC_TO_MIDR_RATE / (10**USDC_DECIMALS / 10**MIDR_DECIMALS);
        
        // Get mIDR token contract
        IERC20 midrToken = IERC20(MIDR_ADDRESS);
        
        // Check if contract has sufficient mIDR balance
        require(midrToken.balanceOf(address(this)) >= amountMIDR, "Insufficient mIDR balance for settlement");
        
        // Transfer mIDR to merchant (seller)
        require(
            midrToken.transfer(invoice.merchant, amountMIDR),
            "mIDR transfer failed"
        );
        
        // Update invoice status
        invoice.settled = true;
        invoice.settledAt = block.timestamp;
        
        // Update counters
        totalSettledInvoices++;
        
        // Emit event
        emit InvoiceSettled(_invoiceId, invoice.merchant, amountMIDR);
    }
    
    /**
     * @dev Handles complete X402 payment flow: receive USDC, swap to mIDR, settle to merchant
     * @dev THIS IS THE MAIN ONCHAIN SWAP FUNCTION - Called by backend after x402 payment
     * @dev Flow: Backend verifies x402 → Calls this → Contract receives USDC → Swaps to mIDR → Merchant receives mIDR
     * @param _invoiceId Unique identifier for the invoice
     * @param _payer Address of the payer from X402 payment
     * @param _usdcAmount Amount of USDC received (in smallest unit, 6 decimals)
     */
    function processX402Payment(
        string memory _invoiceId,
        address _payer,
        uint256 _usdcAmount
    ) external onlyBackend invoiceExists(_invoiceId) {
        Invoice storage invoice = invoices[_invoiceId];
        
        require(!invoice.paid, "Invoice already paid");
        require(_usdcAmount >= invoice.amountUSDC, "Insufficient USDC amount");
        
        // Get USDC token contract
        IERC20 usdcToken = IERC20(USDC_ADDRESS);
        
        // Transfer USDC from backend (who received from x402) to this contract
        // Backend must approve this contract first
        require(
            usdcToken.transferFrom(msg.sender, address(this), _usdcAmount),
            "USDC transfer to contract failed"
        );
        
        // Mark as paid
        invoice.paid = true;
        invoice.paidAt = block.timestamp;
        totalPaidInvoices++;
        
        // Emit payment event
        emit InvoicePaid(_invoiceId, _payer);
        
        // === ONCHAIN SWAP: USDC → mIDR with fixed rate ===
        // Calculate mIDR amount using fixed rate: 1 USDC = 16,600 mIDR
        uint256 amountMIDR = _usdcAmount * USDC_TO_MIDR_RATE / (10**USDC_DECIMALS / 10**MIDR_DECIMALS);
        
        // Get mIDR token contract
        IERC20 midrToken = IERC20(MIDR_ADDRESS);
        
        // Check if contract has sufficient mIDR liquidity
        require(midrToken.balanceOf(address(this)) >= amountMIDR, "Insufficient mIDR liquidity for swap");
        
        // Transfer mIDR to merchant (complete the swap)
        require(
            midrToken.transfer(invoice.merchant, amountMIDR),
            "mIDR transfer to merchant failed"
        );
        
        // Update settlement status
        invoice.settled = true;
        invoice.settledAt = block.timestamp;
        totalSettledInvoices++;
        
        // Emit settlement event
        emit InvoiceSettled(_invoiceId, invoice.merchant, amountMIDR);
    }

    // ============ ADMIN FUNCTIONS ============
    
    /**
     * @dev Updates the backend address (only owner)
     * @param _newBackendAddress New backend address
     */
    function setBackendAddress(address _newBackendAddress) external onlyOwner {
        require(_newBackendAddress != address(0), "Invalid backend address");
        backendAddress = _newBackendAddress;
    }
    
    /**
     * @dev Add mIDR liquidity to contract for swaps (only owner)
     * @dev Owner must approve this contract to spend mIDR first
     * @param _amount Amount of mIDR to add as liquidity
     */
    function addLiquidity(uint256 _amount) external onlyOwner {
        require(_amount > 0, "Amount must be greater than zero");
        IERC20 midrToken = IERC20(MIDR_ADDRESS);
        require(
            midrToken.transferFrom(msg.sender, address(this), _amount),
            "mIDR transfer failed"
        );
    }
    
    /**
     * @dev Withdraw USDC collected from swaps (only owner)
     * @param _amount Amount of USDC to withdraw
     */
    function withdrawUSDC(uint256 _amount) external onlyOwner {
        IERC20 usdcToken = IERC20(USDC_ADDRESS);
        require(usdcToken.balanceOf(address(this)) >= _amount, "Insufficient USDC balance");
        require(
            usdcToken.transfer(msg.sender, _amount),
            "USDC transfer failed"
        );
    }
    
    /**
     * @dev Withdraw mIDR liquidity (only owner)
     * @param _amount Amount of mIDR to withdraw
     */
    function withdrawMIDR(uint256 _amount) external onlyOwner {
        IERC20 midrToken = IERC20(MIDR_ADDRESS);
        require(midrToken.balanceOf(address(this)) >= _amount, "Insufficient mIDR balance");
        require(
            midrToken.transfer(msg.sender, _amount),
            "mIDR transfer failed"
        );
    }
    
    /**
     * @dev Deposits mIDR tokens to contract for settlement (only owner)
     * @dev DEPRECATED: Use addLiquidity instead
     * @param _amount Amount of mIDR to deposit
     */
    function depositMIDR(uint256 _amount) external onlyOwner {
        IERC20 midrToken = IERC20(MIDR_ADDRESS);
        require(
            midrToken.transferFrom(msg.sender, address(this), _amount),
            "mIDR transfer failed"
        );
    }
    
    /**
     * @dev Simulates USDC to mIDR swap and deposits mIDR to contract
     * @dev This function simulates the X402 backend swapping USDC for mIDR
     * @param _amountUSDC Amount of USDC that was received (for calculation)
     * @param _amountMIDR Amount of mIDR to deposit (should be calculated externally)
     */
    function simulateUSDCToMIDRSwap(
        uint256 _amountUSDC,
        uint256 _amountMIDR
    ) external onlyBackend {
        require(_amountUSDC > 0, "USDC amount must be greater than zero");
        require(_amountMIDR > 0, "mIDR amount must be greater than zero");
        
        // Verify the mIDR amount matches the expected conversion rate
        uint256 expectedMIDR = _amountUSDC * USDC_TO_MIDR_RATE / (10**USDC_DECIMALS / 10**MIDR_DECIMALS);
        require(_amountMIDR == expectedMIDR, "mIDR amount does not match expected conversion rate");
        
        // Transfer mIDR to contract
        IERC20 midrToken = IERC20(MIDR_ADDRESS);
        require(
            midrToken.transferFrom(msg.sender, address(this), _amountMIDR),
            "mIDR transfer failed"
        );
    }

    // ============ VIEW FUNCTIONS ============
    
    /**
     * @dev Returns invoice details by invoice ID
     * @param _invoiceId Unique identifier for the invoice
     * @return merchant Address of the merchant
     * @return amountUSDC Amount in USDC (6 decimals)
     * @return paid Payment status
     * @return settled Settlement status
     * @return createdAt Timestamp when invoice was created
     * @return paidAt Timestamp when invoice was marked as paid
     * @return settledAt Timestamp when invoice was settled
     */
    function getInvoice(string memory _invoiceId) external view invoiceExists(_invoiceId) returns (
        address merchant,
        uint256 amountUSDC,
        bool paid,
        bool settled,
        uint256 createdAt,
        uint256 paidAt,
        uint256 settledAt
    ) {
        Invoice memory invoice = invoices[_invoiceId];
        return (
            invoice.merchant,
            invoice.amountUSDC,
            invoice.paid,
            invoice.settled,
            invoice.createdAt,
            invoice.paidAt,
            invoice.settledAt
        );
    }
    
    /**
     * @dev Returns all invoice IDs created by a specific merchant
     * @param _merchant Address of the merchant
     * @return Array of invoice IDs
     */
    function getMerchantInvoices(address _merchant) external view returns (string[] memory) {
        return merchantInvoices[_merchant];
    }
    
    /**
     * @dev Returns the number of invoices created by a specific merchant
     * @param _merchant Address of the merchant
     * @return Number of invoices created
     */
    function getMerchantInvoiceCount(address _merchant) external view returns (uint256) {
        return merchantInvoices[_merchant].length;
    }
    
    /**
     * @dev Returns contract statistics
     * @return totalInvoices Total number of invoices created
     * @return totalPaidInvoices Total number of paid invoices
     * @return totalSettledInvoices Total number of settled invoices
     */
    function getContractStats() external view returns (uint256, uint256, uint256) {
        return (totalInvoices, totalPaidInvoices, totalSettledInvoices);
    }
    
    /**
     * @dev Checks if an invoice exists
     * @param _invoiceId Unique identifier for the invoice
     * @return True if invoice exists, false otherwise
     */
    function checkInvoiceExists(string memory _invoiceId) external view returns (bool) {
        return invoices[_invoiceId].merchant != address(0);
    }
    
    /**
     * @dev Checks if an invoice is paid
     * @param _invoiceId Unique identifier for the invoice
     * @return True if invoice is paid, false otherwise
     */
    function isInvoicePaid(string memory _invoiceId) external view returns (bool) {
        return invoices[_invoiceId].paid;
    }
    
    /**
     * @dev Checks if an invoice is settled
     * @param _invoiceId Unique identifier for the invoice
     * @return True if invoice is settled, false otherwise
     */
    function isInvoiceSettled(string memory _invoiceId) external view returns (bool) {
        return invoices[_invoiceId].settled;
    }
    
    /**
     * @dev Calculates mIDR amount for a given USDC amount
     * @param _amountUSDC Amount in USDC (6 decimals)
     * @return Amount in mIDR (2 decimals)
     */
    function calculateMIDRAmount(uint256 _amountUSDC) external pure returns (uint256) {
        return _amountUSDC * USDC_TO_MIDR_RATE / (10**USDC_DECIMALS / 10**MIDR_DECIMALS);
    }
    
    /**
     * @dev Returns the current USDC to mIDR exchange rate
     * @return Exchange rate (1 USDC = X mIDR)
     */
    function getExchangeRate() external pure returns (uint256) {
        return USDC_TO_MIDR_RATE;
    }
    
    /**
     * @dev Converts IDR amount to USDC amount using fixed rate
     * @dev This function helps backend calculate USDC amount from IDR
     * @param _amountIDR Amount in IDR (2 decimals)
     * @return Amount in USDC (6 decimals)
     */
    function convertIDRToUSDC(uint256 _amountIDR) external pure returns (uint256) {
        // 1 USDC = 16600 IDR
        // IDR has 2 decimals, USDC has 6 decimals
        // amountIDR * (10^6 / 10^2) / 16600 = amountIDR * 10^4 / 16600
        return _amountIDR * (10**USDC_DECIMALS / 10**MIDR_DECIMALS) / USDC_TO_MIDR_RATE;
    }
    
    /**
     * @dev Converts USDC amount to IDR amount using fixed rate
     * @dev This function helps backend calculate IDR amount from USDC
     * @param _amountUSDC Amount in USDC (6 decimals)
     * @return Amount in IDR (2 decimals)
     */
    function convertUSDCToIDR(uint256 _amountUSDC) external pure returns (uint256) {
        // 1 USDC = 16600 IDR
        // USDC has 6 decimals, IDR has 2 decimals
        // amountUSDC * 16600 * (10^2 / 10^6) = amountUSDC * 16600 / 10^4
        return _amountUSDC * USDC_TO_MIDR_RATE / (10**USDC_DECIMALS / 10**MIDR_DECIMALS);
    }
    
    /**
     * @dev Get current USDC balance held by contract
     * @return USDC balance in smallest unit (6 decimals)
     */
    function getUSDCBalance() external view returns (uint256) {
        return IERC20(USDC_ADDRESS).balanceOf(address(this));
    }
    
    /**
     * @dev Get current mIDR liquidity available for swaps
     * @return mIDR balance in smallest unit (2 decimals)
     */
    function getMIDRLiquidity() external view returns (uint256) {
        return IERC20(MIDR_ADDRESS).balanceOf(address(this));
    }
    
}

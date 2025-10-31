// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/InvoicePayment.sol";
import "../src/mocks/MockIDR.sol";

/**
 * @title InvoicePaymentTest
 * @dev Comprehensive test suite for InvoicePayment contract with X402 payment flow
 */
contract InvoicePaymentTest is Test {
    InvoicePayment public invoicePayment;
    MockIDR public mockIDR;
    
    address public owner;
    address public backend;
    address public merchant;
    address public customer;
    address public otherUser;
    
    string public constant INVOICE_ID = "INV-12345-ABCD";
    uint256 public constant INVOICE_AMOUNT_USDC = 100 * 10**6; // 100 USDC (6 decimals)
    uint256 public constant EXPECTED_MIDR_AMOUNT = 1660000e2; // 100 USDC * 16600 mIDR/USDC (2 decimals)
    
    event InvoiceCreated(
        string indexed invoiceId,
        address indexed merchant,
        uint256 amountUSDC
    );
    
    event InvoicePaid(
        string indexed invoiceId,
        address indexed payer
    );
    
    event InvoiceSettled(
        string indexed invoiceId,
        address indexed merchant,
        uint256 amountMIDR
    );
    
    function setUp() public {
        // Setup test accounts
        owner = makeAddr("owner");
        backend = makeAddr("backend");
        merchant = makeAddr("merchant");
        customer = makeAddr("customer");
        otherUser = makeAddr("otherUser");
        
        // Deploy contracts
        mockIDR = new MockIDR();
        
        // Use a mock USDC address for testing (you can replace with your actual USDC address)
        address mockUSDCAddress = makeAddr("mockUSDC");
        
        vm.prank(owner);
        invoicePayment = new InvoicePayment(
            mockUSDCAddress,
            address(mockIDR),
            backend
        );
        
        // Distribute mIDR tokens to contract for settlement
        vm.prank(owner);
        mockIDR.transfer(address(invoicePayment), 100000000e2); // 100M mIDR (2 decimals)
    }
    
    // ============ CREATE INVOICE TESTS ============
    
    function testCreateInvoice() public {
        vm.prank(merchant);
        invoicePayment.createInvoice(
            merchant,
            INVOICE_AMOUNT_USDC,
            INVOICE_ID
        );
        
        // Check invoice was created correctly
        (
            address invoiceMerchant,
            uint256 invoiceAmountUSDC,
            bool invoicePaid,
            bool invoiceSettled,
            uint256 invoiceCreatedAt,
            uint256 invoicePaidAt,
            uint256 invoiceSettledAt
        ) = invoicePayment.getInvoice(INVOICE_ID);
        
        assertEq(invoiceMerchant, merchant);
        assertEq(invoiceAmountUSDC, INVOICE_AMOUNT_USDC);
        assertFalse(invoicePaid);
        assertFalse(invoiceSettled);
        assertGt(invoiceCreatedAt, 0);
        assertEq(invoicePaidAt, 0);
        assertEq(invoiceSettledAt, 0);
        
        // Check merchant invoice count
        assertEq(invoicePayment.getMerchantInvoiceCount(merchant), 1);
        assertEq(invoicePayment.totalInvoices(), 1);
    }
    
    function testCreateInvoiceEmitsEvent() public {
        vm.expectEmit(true, true, false, true);
        emit InvoiceCreated(INVOICE_ID, merchant, INVOICE_AMOUNT_USDC);
        
        vm.prank(merchant);
        invoicePayment.createInvoice(
            merchant,
            INVOICE_AMOUNT_USDC,
            INVOICE_ID
        );
    }
    
    function testCreateInvoiceFailsWithEmptyId() public {
        vm.prank(merchant);
        vm.expectRevert("Invoice ID cannot be empty");
        invoicePayment.createInvoice(merchant, INVOICE_AMOUNT_USDC, "");
    }
    
    function testCreateInvoiceFailsWithZeroAmount() public {
        vm.prank(merchant);
        vm.expectRevert("Amount must be greater than zero");
        invoicePayment.createInvoice(merchant, 0, INVOICE_ID);
    }
    
    function testCreateInvoiceFailsWithZeroAddress() public {
        vm.prank(merchant);
        vm.expectRevert("Invalid merchant address");
        invoicePayment.createInvoice(address(0), INVOICE_AMOUNT_USDC, INVOICE_ID);
    }
    
    function testCreateInvoiceFailsWithDuplicateId() public {
        vm.startPrank(merchant);
        invoicePayment.createInvoice(merchant, INVOICE_AMOUNT_USDC, INVOICE_ID);
        vm.expectRevert("Invoice ID already exists");
        invoicePayment.createInvoice(merchant, INVOICE_AMOUNT_USDC, INVOICE_ID);
        vm.stopPrank();
    }
    
    function testCreateInvoiceByAnyone() public {
        // Anyone can create an invoice for any merchant
        vm.prank(otherUser);
        invoicePayment.createInvoice(merchant, INVOICE_AMOUNT_USDC, "INV-OTHER");
        
        (
            address invoiceMerchant,
            uint256 invoiceAmountUSDC,
            bool invoicePaid,
            bool invoiceSettled,
            uint256 invoiceCreatedAt,
            uint256 invoicePaidAt,
            uint256 invoiceSettledAt
        ) = invoicePayment.getInvoice("INV-OTHER");
        
        assertEq(invoiceMerchant, merchant);
        assertEq(invoiceAmountUSDC, INVOICE_AMOUNT_USDC);
    }
    
    // ============ MARK AS PAID TESTS (Backend Only) ============
    
    function testMarkAsPaid() public {
        // Create invoice first
        vm.prank(merchant);
        invoicePayment.createInvoice(merchant, INVOICE_AMOUNT_USDC, INVOICE_ID);
        
        // Backend marks as paid (simulating X402 payment confirmation)
        vm.prank(backend);
        invoicePayment.markAsPaid(INVOICE_ID, customer);
        
        // Check invoice was marked as paid correctly
        (
            address invoiceMerchant,
            uint256 invoiceAmountUSDC,
            bool invoicePaid,
            bool invoiceSettled,
            uint256 invoiceCreatedAt,
            uint256 invoicePaidAt,
            uint256 invoiceSettledAt
        ) = invoicePayment.getInvoice(INVOICE_ID);
        
        assertTrue(invoicePaid);
        assertGt(invoicePaidAt, 0);
        assertFalse(invoiceSettled);
        
        // Check counters
        assertEq(invoicePayment.totalPaidInvoices(), 1);
        assertEq(invoicePayment.totalSettledInvoices(), 0);
    }
    
    function testMarkAsPaidEmitsEvent() public {
        // Create invoice first
        vm.prank(merchant);
        invoicePayment.createInvoice(merchant, INVOICE_AMOUNT_USDC, INVOICE_ID);
        
        // Expect event
        vm.expectEmit(true, true, false, true);
        emit InvoicePaid(INVOICE_ID, customer);
        
        // Backend marks as paid
        vm.prank(backend);
        invoicePayment.markAsPaid(INVOICE_ID, customer);
    }
    
    function testMarkAsPaidFailsWithNonExistentInvoice() public {
        vm.prank(backend);
        vm.expectRevert("Invoice does not exist");
        invoicePayment.markAsPaid("NON_EXISTENT", customer);
    }
    
    function testMarkAsPaidFailsWhenAlreadyPaid() public {
        // Create and mark as paid
        vm.prank(merchant);
        invoicePayment.createInvoice(merchant, INVOICE_AMOUNT_USDC, INVOICE_ID);
        
        vm.prank(backend);
        invoicePayment.markAsPaid(INVOICE_ID, customer);
        
        // Try to mark as paid again
        vm.prank(backend);
        vm.expectRevert("Invoice already paid");
        invoicePayment.markAsPaid(INVOICE_ID, customer);
    }
    
    function testMarkAsPaidFailsWithNonBackend() public {
        // Create invoice first
        vm.prank(merchant);
        invoicePayment.createInvoice(merchant, INVOICE_AMOUNT_USDC, INVOICE_ID);
        
        // Non-backend tries to mark as paid
        vm.prank(customer);
        vm.expectRevert("Only backend can call this function");
        invoicePayment.markAsPaid(INVOICE_ID, customer);
    }
    
    // ============ SETTLE INVOICE TESTS (Backend Only) ============
    
    function testSettleInvoice() public {
        // Create and mark as paid
        vm.prank(merchant);
        invoicePayment.createInvoice(merchant, INVOICE_AMOUNT_USDC, INVOICE_ID);
        
        vm.prank(backend);
        invoicePayment.markAsPaid(INVOICE_ID, customer);
        
        // Get initial mIDR balance
        uint256 initialBalance = mockIDR.balanceOf(merchant);
        
        // Backend settles invoice
        vm.prank(backend);
        invoicePayment.settleInvoice(INVOICE_ID);
        
        // Check invoice was settled correctly
        (
            address invoiceMerchant,
            uint256 invoiceAmountUSDC,
            bool invoicePaid,
            bool invoiceSettled,
            uint256 invoiceCreatedAt,
            uint256 invoicePaidAt,
            uint256 invoiceSettledAt
        ) = invoicePayment.getInvoice(INVOICE_ID);
        
        assertTrue(invoiceSettled);
        assertGt(invoiceSettledAt, 0);
        
        // Check mIDR was transferred to merchant
        uint256 finalBalance = mockIDR.balanceOf(merchant);
        assertEq(finalBalance - initialBalance, EXPECTED_MIDR_AMOUNT);
        
        // Check counters
        assertEq(invoicePayment.totalSettledInvoices(), 1);
    }
    
    function testSettleInvoiceEmitsEvent() public {
        // Create and mark as paid
        vm.prank(merchant);
        invoicePayment.createInvoice(merchant, INVOICE_AMOUNT_USDC, INVOICE_ID);
        
        vm.prank(backend);
        invoicePayment.markAsPaid(INVOICE_ID, customer);
        
        // Expect event
        vm.expectEmit(true, true, false, true);
        emit InvoiceSettled(INVOICE_ID, merchant, EXPECTED_MIDR_AMOUNT);
        
        // Backend settles invoice
        vm.prank(backend);
        invoicePayment.settleInvoice(INVOICE_ID);
    }
    
    function testSettleInvoiceFailsWithNonExistentInvoice() public {
        vm.prank(backend);
        vm.expectRevert("Invoice does not exist");
        invoicePayment.settleInvoice("NON_EXISTENT");
    }
    
    function testSettleInvoiceFailsWhenNotPaid() public {
        // Create invoice but don't mark as paid
        vm.prank(merchant);
        invoicePayment.createInvoice(merchant, INVOICE_AMOUNT_USDC, INVOICE_ID);
        
        vm.prank(backend);
        vm.expectRevert("Invoice must be paid before settlement");
        invoicePayment.settleInvoice(INVOICE_ID);
    }
    
    function testSettleInvoiceFailsWhenAlreadySettled() public {
        // Create, mark as paid, and settle
        vm.prank(merchant);
        invoicePayment.createInvoice(merchant, INVOICE_AMOUNT_USDC, INVOICE_ID);
        
        vm.prank(backend);
        invoicePayment.markAsPaid(INVOICE_ID, customer);
        
        vm.prank(backend);
        invoicePayment.settleInvoice(INVOICE_ID);
        
        // Try to settle again
        vm.prank(backend);
        vm.expectRevert("Invoice already settled");
        invoicePayment.settleInvoice(INVOICE_ID);
    }
    
    function testSettleInvoiceFailsWithNonBackend() public {
        // Create and mark as paid
        vm.prank(merchant);
        invoicePayment.createInvoice(merchant, INVOICE_AMOUNT_USDC, INVOICE_ID);
        
        vm.prank(backend);
        invoicePayment.markAsPaid(INVOICE_ID, customer);
        
        // Non-backend tries to settle
        vm.prank(customer);
        vm.expectRevert("Only backend can call this function");
        invoicePayment.settleInvoice(INVOICE_ID);
    }
    
    function testSettleInvoiceFailsWithInsufficientMIDR() public {
        // Create and mark as paid
        vm.prank(merchant);
        invoicePayment.createInvoice(merchant, INVOICE_AMOUNT_USDC, INVOICE_ID);
        
        vm.prank(backend);
        invoicePayment.markAsPaid(INVOICE_ID, customer);
        
        // Remove all mIDR from contract
        vm.prank(owner);
        mockIDR.transfer(owner, mockIDR.balanceOf(address(invoicePayment)));
        
        // Try to settle
        vm.prank(backend);
        vm.expectRevert("Insufficient mIDR balance for settlement");
        invoicePayment.settleInvoice(INVOICE_ID);
    }
    
    // ============ VIEW FUNCTION TESTS ============
    
    function testGetMerchantInvoices() public {
        // Create multiple invoices
        vm.startPrank(merchant);
        invoicePayment.createInvoice(merchant, 100 * 10**6, "INV-1");
        invoicePayment.createInvoice(merchant, 200 * 10**6, "INV-2");
        invoicePayment.createInvoice(merchant, 300 * 10**6, "INV-3");
        vm.stopPrank();
        
        string[] memory merchantInvoices = invoicePayment.getMerchantInvoices(merchant);
        assertEq(merchantInvoices.length, 3);
        assertEq(merchantInvoices[0], "INV-1");
        assertEq(merchantInvoices[1], "INV-2");
        assertEq(merchantInvoices[2], "INV-3");
    }
    
    function testGetContractStats() public {
        // Create, mark as paid, and settle some invoices
        vm.startPrank(merchant);
        invoicePayment.createInvoice(merchant, 100 * 10**6, "INV-1");
        invoicePayment.createInvoice(merchant, 200 * 10**6, "INV-2");
        vm.stopPrank();
        
        // Mark first invoice as paid and settle
        vm.prank(backend);
        invoicePayment.markAsPaid("INV-1", customer);
        
        vm.prank(backend);
        invoicePayment.settleInvoice("INV-1");
        
        (uint256 totalInvoices, uint256 totalPaidInvoices, uint256 totalSettledInvoices) = invoicePayment.getContractStats();
        assertEq(totalInvoices, 2);
        assertEq(totalPaidInvoices, 1);
        assertEq(totalSettledInvoices, 1);
    }
    
    function testInvoiceExists() public {
        assertFalse(invoicePayment.checkInvoiceExists(INVOICE_ID));
        
        vm.prank(merchant);
        invoicePayment.createInvoice(merchant, INVOICE_AMOUNT_USDC, INVOICE_ID);
        
        assertTrue(invoicePayment.checkInvoiceExists(INVOICE_ID));
    }
    
    function testIsInvoicePaid() public {
        // Create invoice
        vm.prank(merchant);
        invoicePayment.createInvoice(merchant, INVOICE_AMOUNT_USDC, INVOICE_ID);
        
        assertFalse(invoicePayment.isInvoicePaid(INVOICE_ID));
        
        // Mark as paid
        vm.prank(backend);
        invoicePayment.markAsPaid(INVOICE_ID, customer);
        
        assertTrue(invoicePayment.isInvoicePaid(INVOICE_ID));
    }
    
    function testIsInvoiceSettled() public {
        // Create invoice
        vm.prank(merchant);
        invoicePayment.createInvoice(merchant, INVOICE_AMOUNT_USDC, INVOICE_ID);
        
        assertFalse(invoicePayment.isInvoiceSettled(INVOICE_ID));
        
        // Mark as paid and settle
        vm.prank(backend);
        invoicePayment.markAsPaid(INVOICE_ID, customer);
        
        assertFalse(invoicePayment.isInvoiceSettled(INVOICE_ID));
        
        vm.prank(backend);
        invoicePayment.settleInvoice(INVOICE_ID);
        
        assertTrue(invoicePayment.isInvoiceSettled(INVOICE_ID));
    }
    
    function testCalculateMIDRAmount() public {
        uint256 amountUSDC = 100 * 10**6; // 100 USDC
        uint256 expectedMIDR = 100 * 16600e2; // 100 * 16600 * 10^2 (decimals conversion)
        
        uint256 calculatedMIDR = invoicePayment.calculateMIDRAmount(amountUSDC);
        assertEq(calculatedMIDR, expectedMIDR);
    }
    
    function testGetExchangeRate() public {
        uint256 rate = invoicePayment.getExchangeRate();
        assertEq(rate, 16600);
    }
    
    // ============ EDGE CASE TESTS ============
    
    function testMultipleMerchants() public {
        address merchant2 = makeAddr("merchant2");
        
        vm.prank(merchant);
        invoicePayment.createInvoice(merchant, 100 * 10**6, "INV-1");
        
        vm.prank(merchant2);
        invoicePayment.createInvoice(merchant2, 200 * 10**6, "INV-2");
        
        assertEq(invoicePayment.getMerchantInvoiceCount(merchant), 1);
        assertEq(invoicePayment.getMerchantInvoiceCount(merchant2), 1);
        assertEq(invoicePayment.totalInvoices(), 2);
    }
    
    function testFullPaymentFlow() public {
        // Create invoice
        vm.prank(merchant);
        invoicePayment.createInvoice(merchant, INVOICE_AMOUNT_USDC, INVOICE_ID);
        
        // Check initial state
        assertFalse(invoicePayment.isInvoicePaid(INVOICE_ID));
        assertFalse(invoicePayment.isInvoiceSettled(INVOICE_ID));
        
        // Mark as paid
        vm.prank(backend);
        invoicePayment.markAsPaid(INVOICE_ID, customer);
        
        assertTrue(invoicePayment.isInvoicePaid(INVOICE_ID));
        assertFalse(invoicePayment.isInvoiceSettled(INVOICE_ID));
        
        // Get initial mIDR balance
        uint256 initialBalance = mockIDR.balanceOf(merchant);
        
        // Settle invoice
        vm.prank(backend);
        invoicePayment.settleInvoice(INVOICE_ID);
        
        assertTrue(invoicePayment.isInvoiceSettled(INVOICE_ID));
        
        // Check mIDR was transferred
        uint256 finalBalance = mockIDR.balanceOf(merchant);
        assertEq(finalBalance - initialBalance, EXPECTED_MIDR_AMOUNT);
    }
    
    function testX402PaymentFlow() public {
        // Create invoice
        vm.prank(merchant);
        invoicePayment.createInvoice(merchant, INVOICE_AMOUNT_USDC, INVOICE_ID);
        
        // Check initial state
        assertFalse(invoicePayment.isInvoicePaid(INVOICE_ID));
        assertFalse(invoicePayment.isInvoiceSettled(INVOICE_ID));
        
        // Get initial mIDR balance
        uint256 initialBalance = mockIDR.balanceOf(merchant);
        
        // Backend receives USDC from x402, approves contract, then processes payment
        // Note: In real scenario, backend would have USDC from x402 facilitator
        vm.prank(backend);
        invoicePayment.processX402Payment(INVOICE_ID, customer, INVOICE_AMOUNT_USDC);
        
        // Check both paid and settled
        assertTrue(invoicePayment.isInvoicePaid(INVOICE_ID));
        assertTrue(invoicePayment.isInvoiceSettled(INVOICE_ID));
        
        // Check mIDR was transferred to seller
        uint256 finalBalance = mockIDR.balanceOf(merchant);
        assertEq(finalBalance - initialBalance, EXPECTED_MIDR_AMOUNT);
        
        // Check counters
        assertEq(invoicePayment.totalPaidInvoices(), 1);
        assertEq(invoicePayment.totalSettledInvoices(), 1);
    }
    
    function testSimulateUSDCToMIDRSwap() public {
        uint256 usdcAmount = 100 * 10**6; // 100 USDC
        uint256 expectedMIDR = 100 * 16600e2; // 100 * 16600 * 10^2
        
        // Backend simulates USDC to mIDR swap
        vm.prank(backend);
        mockIDR.approve(address(invoicePayment), expectedMIDR);
        
        vm.prank(backend);
        invoicePayment.simulateUSDCToMIDRSwap(usdcAmount, expectedMIDR);
        
        // Check mIDR was deposited to contract
        assertEq(mockIDR.balanceOf(address(invoicePayment)), 10000000e2 + expectedMIDR);
    }
    
    function testSimulateUSDCToMIDRSwapFailsWithWrongAmount() public {
        uint256 usdcAmount = 100 * 10**6; // 100 USDC
        uint256 wrongMIDR = 1000e2; // Wrong mIDR amount
        
        vm.prank(backend);
        mockIDR.approve(address(invoicePayment), wrongMIDR);
        
        vm.prank(backend);
        vm.expectRevert("mIDR amount does not match expected conversion rate");
        invoicePayment.simulateUSDCToMIDRSwap(usdcAmount, wrongMIDR);
    }
    
    // ============ ADMIN FUNCTION TESTS ============
    
    function testSetBackendAddress() public {
        address newBackend = makeAddr("newBackend");
        
        vm.prank(owner);
        invoicePayment.setBackendAddress(newBackend);
        
        assertEq(invoicePayment.backendAddress(), newBackend);
    }
    
    function testSetBackendAddressFailsWithNonOwner() public {
        address newBackend = makeAddr("newBackend");
        
        vm.prank(customer);
        vm.expectRevert();
        invoicePayment.setBackendAddress(newBackend);
    }
    
    function testDepositMIDR() public {
        uint256 depositAmount = 1000e2;
        
        vm.prank(owner);
        mockIDR.approve(address(invoicePayment), depositAmount);
        
        vm.prank(owner);
        invoicePayment.depositMIDR(depositAmount);
        
        assertEq(mockIDR.balanceOf(address(invoicePayment)), 10000000e2 + depositAmount);
    }
    
    function testDepositMIDRFailsWithNonOwner() public {
        uint256 depositAmount = 1000e2;
        
        vm.prank(customer);
        mockIDR.approve(address(invoicePayment), depositAmount);
        
        vm.prank(customer);
        vm.expectRevert();
        invoicePayment.depositMIDR(depositAmount);
    }
}

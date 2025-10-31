# 🔧 ERC20 Allowance Issue Fix

## Problem

Error: `ERC20: transfer amount exceeds allowance`

Users had to sign **twice** before payment succeeded:

1. **First attempt** → Failed with allowance error
2. **Second attempt** → Succeeded (because allowance was set from first attempt)

## Root Cause

The original code had several issues:

### 1. **No Allowance Check**

Code always called `approve()` without checking if allowance already exists:

```javascript
// ❌ WRONG - Always approves, even if not needed
const approveTx = await walletClient.writeContract({
  functionName: "approve",
  args: [contractAddress, amount],
  nonce, // Hardcoded nonce
});
```

### 2. **Hardcoded Nonce Management**

```javascript
nonce: nonce + 1; // ❌ Can cause conflicts on retry
```

If first transaction fails and user retries, nonce becomes invalid.

### 3. **Race Condition**

`processX402Payment` was called immediately after `approve` without:

- Waiting for sufficient confirmations
- Checking if approval actually completed
- Verifying blockchain state updated

### 4. **No Error Recovery**

If approval failed/reverted, no retry mechanism existed.

---

## ✅ Solution Implemented

### 1. **Check Allowance First**

```javascript
// ✅ CORRECT - Check current allowance
const currentAllowance = await publicClient.readContract({
  address: usdcAddress,
  abi: ERC20_ABI,
  functionName: "allowance",
  args: [account.address, contractAddress],
});

// Only approve if insufficient
if (currentAllowance < usdcAmountInSmallestUnit) {
  // Approve needed amount
}
```

### 2. **Reset Allowance if Needed**

Some ERC20 tokens (like USDT) require allowance to be 0 before setting new value:

```javascript
if (currentAllowance > 0n) {
  // Reset to 0 first
  await walletClient.writeContract({
    functionName: "approve",
    args: [contractAddress, 0n],
  });
  await publicClient.waitForTransactionReceipt({ hash: resetTx });
}
```

### 3. **Wait for Confirmations**

```javascript
// Wait for approval to be mined
const approvalReceipt = await publicClient.waitForTransactionReceipt({
  hash: approveTx,
  confirmations: 1, // Wait for at least 1 confirmation
});

// Add delay to ensure blockchain state propagates
await new Promise((resolve) => setTimeout(resolve, 2000));
```

### 4. **Remove Hardcoded Nonce**

Let viem handle nonce management automatically:

```javascript
// ✅ CORRECT - No manual nonce management
const txHash = await walletClient.writeContract({
  functionName: "processX402Payment",
  // viem automatically manages nonce
});
```

### 5. **Added `allowance` to ERC20 ABI**

```javascript
const ERC20_ABI = [
  // ... existing functions
  {
    inputs: [
      { name: "owner", type: "address" },
      { name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
];
```

---

## 📊 Flow Comparison

### Before (❌ Failed on First Try):

```
1. User clicks pay
2. Backend: approve() → TX sent with nonce N
3. Backend: processX402Payment() → TX sent with nonce N+1
4. Blockchain: approve() still pending...
5. Blockchain: processX402Payment() → ❌ REVERT (allowance not set yet)
6. User sees error, clicks pay again
7. Backend: approve() → TX sent with nonce N (again, conflicts!)
8. Backend: processX402Payment() → Now works (previous approve finally confirmed)
```

### After (✅ Works on First Try):

```
1. User clicks pay
2. Backend: Check allowance
3. Backend: If insufficient → approve()
4. Backend: Wait for approval confirmation (1 block)
5. Backend: Wait 2s for state propagation
6. Backend: processX402Payment()
7. Blockchain: ✅ SUCCESS (allowance confirmed)
8. User sees success immediately
```

---

## 🧪 Testing

Test the fix:

```bash
# 1. Start backend
npm start

# 2. Create invoice and get payment URL

# 3. Pay invoice (should succeed on first try now!)

# 4. Check logs for:
# "Checking current USDC allowance..."
# "Current allowance: XXX"
# "Sufficient allowance already exists" OR "Approving..."
# "USDC approval confirmed in block: XXX"
# "Transaction confirmed in block: XXX"
```

---

## 🎯 Benefits

✅ **Single-sign experience** - Users only sign once  
✅ **No failed transactions** - Proper allowance checking  
✅ **Idempotent** - Safe to retry if network issues occur  
✅ **Better UX** - Faster, more reliable payments  
✅ **Gas efficient** - Skip approval if allowance exists

---

## ⚠️ Important Notes

### For USDT and Similar Tokens

Some tokens (USDT on Ethereum) require allowance to be 0 before changing:

```javascript
// This is why we reset to 0 first if currentAllowance > 0
```

### Confirmation Wait Time

The 2-second delay ensures blockchain state propagates across nodes:

```javascript
await new Promise((resolve) => setTimeout(resolve, 2000));
```

You can adjust this based on:

- Network congestion
- RPC provider reliability
- Required reliability level

### Gas Optimization

If allowance already exists (e.g., from previous payment), we skip approval entirely:

```javascript
if (currentAllowance >= usdcAmountInSmallestUnit) {
  logger.info("Sufficient allowance exists, skipping approval");
  // Save gas!
}
```

---

## 🔗 References

- [ERC20 Standard](https://eips.ethereum.org/EIPS/eip-20)
- [viem Documentation](https://viem.sh/)
- [Allowance Attack Vector](https://docs.openzeppelin.com/contracts/2.x/api/token/erc20#IERC20-approve-address-uint256-)

---

**Issue:** Double-sign required for payment  
**Status:** ✅ FIXED  
**Files Changed:**

- `src/services/contract.service.js` - Added allowance check and proper approval flow

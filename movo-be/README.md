# Movo Backend API

Backend service for Movo payment platform with x402 protocol integration.

## Features

- 📧 Invoice creation and email delivery
- 💳 x402 payment protocol integration
- 🔄 Automatic USDC to mIDR conversion
- 🗄️ PostgreSQL database with Prisma ORM
- 📊 Payment tracking and status management

## Architecture

```
Customer                    Merchant
   │                           │
   │  1. Create Invoice        │
   │◄──────────────────────────┤
   │                           │
   │  2. Email Invoice         │
   │◄──────────────────────────┤
   │                           │
   │  3. Open Payment Link     │
   ├───────────────────────────▶
   │                           │
   │  4. Pay with USDC (x402)  │
   ├───────────────────────────▶
   │                           │
   │  5. Auto Swap to mIDR     │
   │         ┌─────────┐       │
   │         │  Swap   │       │
   │         │ Service │       │
   │         └─────────┘       │
   │                           │
   │  6. Settlement Complete   │
   │◄──────────────────────────┤
```

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/movo_db"

# Wallet
MERCHANT_WALLET_ADDRESS=0x...
MERCHANT_PRIVATE_KEY=0x...

# x402
X402_FACILITATOR_URL=https://x402.org/facilitator
X402_NETWORK=base-sepolia

# Email (choose one)
EMAIL_SERVICE=sendgrid
EMAIL_API_KEY=your_key
EMAIL_FROM=noreply@movo.xyz
```

### 3. Setup Database

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 4. Start Server

```bash
npm run dev
```

Server will run on `http://localhost:4000`

## API Endpoints

### Invoices

#### Create Invoice
```http
POST /api/invoices
Content-Type: application/json

{
  "customerEmail": "customer@example.com",
  "customerName": "John Doe",
  "productName": "Premium Service",
  "description": "Monthly subscription",
  "amount": 1000000,
  "currency": "IDR"
}
```

#### Send Invoice Email
```http
POST /api/invoices/:invoiceId/send
```

#### Get Invoice
```http
GET /api/invoices/:invoiceId
```

### Payments

#### Get Payment Details
```http
GET /api/payments/:invoiceId/details
```

Returns x402 payment requirements:
```json
{
  "maxAmountRequired": "60.24",
  "resource": "/api/payments/verify",
  "description": "Payment for Premium Service",
  "payTo": "0x...",
  "asset": "0x...",
  "network": "base-sepolia"
}
```

#### Process Payment (x402 Protected)
```http
POST /api/payments/verify
X-PAYMENT: <x402-payment-payload>

{
  "invoiceId": "...",
  "transactionHash": "0x...",
  "fromAddress": "0x...",
  "amount": "60.24"
}
```

#### Check Payment Status
```http
GET /api/payments/:invoiceId/status
```

## x402 Integration Flow

1. **Customer receives invoice email** with payment link
2. **Customer clicks "Pay Now"** → Redirected to payment page
3. **Frontend requests payment details** from `/api/payments/:invoiceId/details`
4. **Backend returns 402 Payment Required** with payment instructions
5. **Frontend initiates x402 payment** via wallet signature
6. **Customer signs payment authorization** (ERC-3009)
7. **Frontend sends payment** to `/api/payments/verify` with `X-PAYMENT` header
8. **x402 middleware verifies payment** and facilitator settles on-chain
9. **Backend processes payment** and updates invoice status
10. **Backend initiates USDC → mIDR swap** for settlement
11. **Confirmation emails sent** to both parties

## Email Templates

Email templates use Handlebars. Located in `src/templates/`:

- `invoice-email.hbs` - Invoice notification
- `payment-confirmation.hbs` - Payment receipt

## Database Schema

### Invoice
- Customer details (email, name)
- Product/service information
- Amount in fiat currency
- USDC equivalent and conversion rate
- Status tracking
- Payment details

### PaymentDetail
- Transaction hash
- From/to addresses
- USDC amount paid
- mIDR settlement info
- Swap transaction hash

## Currency Conversion

Mock rates for hackathon (in `src/utils/currency.utils.js`):
- 1 USDC = 16,600 IDR
- 1 USDC = 1 USD
- 1 USDC = 0.92 EUR
- 1 USDC = 1.35 SGD

## USDC to mIDR Swap

Swap logic in `src/services/swap.service.js`:

1. Receive USDC payment via x402
2. Calculate mIDR equivalent (1 USDC = 16,600 mIDR)
3. Execute swap transaction
4. Transfer mIDR to merchant wallet
5. Update settlement status

## Best Practices

### Security
- Never commit `.env` files
- Use environment variables for secrets
- Validate all input data
- Rate limit API endpoints
- Use HTTPS in production

### Error Handling
- All errors logged with timestamps
- Proper HTTP status codes
- Detailed error messages in development
- Generic messages in production

### Database
- Use transactions for multi-step operations
- Index frequently queried fields
- Regular backups
- Migration history tracked

### Email
- Use transactional email service (SendGrid/Resend)
- Template validation before sending
- Track delivery status
- Handle bounces and complaints

## Testing

```bash
# Run tests
npm test

# Test email sending
curl -X POST http://localhost:4000/api/invoices/[id]/send

# Test payment flow
curl -X GET http://localhost:4000/api/payments/[id]/details
```

## Deployment

### Vercel
```bash
vercel deploy
```

### Docker
```bash
docker build -t movo-be .
docker run -p 4000:4000 movo-be
```

## Troubleshooting

### Email not sending
- Check EMAIL_API_KEY is valid
- Verify EMAIL_FROM is authorized
- Check spam folder

### Payment verification failing
- Confirm MERCHANT_WALLET_ADDRESS matches
- Check x402 network configuration
- Verify USDC token address

### Swap failing
- Check merchant has sufficient gas
- Verify swap contract address
- Check mIDR token liquidity

## Support

For issues or questions, contact the Movo team or check documentation at [docs.movo.xyz](https://docs.movo.xyz)

## License

MIT


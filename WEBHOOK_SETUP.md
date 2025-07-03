# Stripe Webhook Setup for Local Development

## Problem
When you complete a checkout locally, no orders are created because Stripe webhooks can't reach your localhost server.

## Solution: Use Stripe CLI with Dual Webhook Setup

The application now uses two different webhook secrets:
- **PERSONAL**: For checkout and payment events (order creation)
- **CONNECTED**: For account onboarding and vendor creation events

### 1. Install Stripe CLI
Download and install the Stripe CLI from: https://stripe.com/docs/stripe-cli

### 2. Login to Stripe
```bash
stripe login
```

### 3. Forward webhooks to your local server
You'll need to run TWO separate Stripe CLI instances:

**Terminal 1 - For Personal Account Events (Checkout/Orders):**
```bash
stripe listen --forward-to localhost:3000/api/v1/stripe/webhook --events checkout.session.completed,payment_intent.succeeded,charge.succeeded
```

**Terminal 2 - For Connected Account Events (Vendor Onboarding):**
```bash
stripe listen --forward-to localhost:3000/api/v1/stripe/webhook --events account.updated,capability.updated,account.external_account.created,person.created --connect
```

### 4. Update your .env.local file
Each Stripe CLI instance will output a different webhook signing secret. Update your `.env.local` file:

```env
STRIPE_WEBHOOK_SECRET_PERSONAL=whsec_1234567890abcdef...  # From Terminal 1
STRIPE_WEBHOOK_SECRET_CONNECTED=whsec_fedcba0987654321... # From Terminal 2
```

### 5. Restart your development server
```bash
npm run dev
```

## Testing

### 1. Test Configuration
```bash
node test-webhook-secrets.js
```

This will verify that both webhook secrets are properly configured.

### 2. Test Checkout Events (Personal Account)
1. Complete a checkout in your app
2. You should see the webhook event in Terminal 1 (personal account CLI)
3. Orders should be created in Firestore
4. Check the store manager orders page to verify

### 3. Test Vendor Onboarding Events (Connected Account)
1. Complete vendor signup process
2. You should see account events in Terminal 2 (connected account CLI)
3. Vendor should be created in Firestore after onboarding completion

### 4. Troubleshooting
- If events aren't being received, check that both CLI instances are running
- Verify webhook secrets match between CLI output and .env.local
- Check that the correct events are being forwarded by each CLI instance

## Alternative: Temporary Testing Endpoint

If you can't set up Stripe CLI immediately, you can use the test endpoint:

```bash
node test-webhook-simulation.js
```

But this won't work with the current verification - you'd need to temporarily disable webhook verification for testing. 
# Stripe Webhook Setup for Local Development

## Problem
When you complete a checkout locally, no orders are created because Stripe webhooks can't reach your localhost server.

## Solution: Use Stripe CLI

### 1. Install Stripe CLI
Download and install the Stripe CLI from: https://stripe.com/docs/stripe-cli

### 2. Login to Stripe
```bash
stripe login
```

### 3. Forward webhooks to your local server
```bash
stripe listen --forward-to localhost:3000/api/v1/stripe/webhook
```

This command will:
- Start listening for webhook events from your Stripe account
- Forward them to your local development server
- Provide you with a webhook signing secret

### 4. Update your .env.local file
The Stripe CLI will output a webhook signing secret like:
```
whsec_1234567890abcdef...
```

Update your `.env.local` file:
```env
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

### 5. Restart your development server
```bash
npm run dev
```

## Testing
1. Complete a checkout in your app
2. You should see the webhook event in the Stripe CLI terminal
3. Orders should be created in Firestore
4. Check the store manager orders page to verify

## Alternative: Temporary Testing Endpoint

If you can't set up Stripe CLI immediately, you can use the test endpoint:

```bash
node test-webhook-simulation.js
```

But this won't work with the current verification - you'd need to temporarily disable webhook verification for testing. 
# Dual Webhook Secret Implementation

## Overview
The application now uses two separate Stripe webhook secrets to handle different types of events:

- **PERSONAL**: For checkout and payment events (order creation)
- **CONNECTED**: For account onboarding and vendor creation events

## Changes Made

### 1. Environment Variables
Updated from single webhook secret to dual secrets:
```env
# OLD (single secret)
STRIPE_WEBHOOK_SECRET=whsec_...

# NEW (dual secrets)
STRIPE_WEBHOOK_SECRET_PERSONAL=whsec_...  # For checkout/payment events
STRIPE_WEBHOOK_SECRET_CONNECTED=whsec_... # For vendor onboarding events
```

### 2. Webhook Route Updates (`src/app/api/v1/stripe/webhook/route.ts`)

**Signature Verification:**
- Now tries both webhook secrets to determine which one works
- Validates that the correct secret was used for the event type
- Logs which secret was used for debugging

**Event Type Validation:**
- Checkout events (`checkout.session.completed`) must use PERSONAL secret
- Payment events (`payment_intent.*`, `charge.*`, `payment.*`) must use PERSONAL secret
- Account events (`account.*`, `capability.*`, `person.*`) must use CONNECTED secret

### 3. Documentation Updates

**WEBHOOK_SETUP.md:**
- Updated to show dual Stripe CLI setup
- Separate terminal instances for each webhook type
- Clear instructions for both personal and connected account events

**production-webhook-debug.md:**
- Updated to show dual webhook configuration in Stripe Dashboard
- Separate webhook endpoints for personal and connected accounts
- Updated environment variable requirements

### 4. Testing
Added `test-webhook-secrets.js` to validate configuration:
- Checks both webhook secrets are present
- Validates webhook secret format
- Provides setup guidance

## Stripe Dashboard Setup

### Personal Account Webhook (Checkout/Orders)
1. Go to **Developers → Webhooks**
2. Create webhook endpoint: `https://your-domain.com/api/v1/stripe/webhook`
3. Select events: `checkout.session.completed`, `payment_intent.succeeded`, `charge.succeeded`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET_PERSONAL`

### Connected Account Webhook (Vendor Onboarding)
1. Go to **Connect → Webhooks**
2. Create webhook endpoint: `https://your-domain.com/api/v1/stripe/webhook`
3. Select events: `account.updated`, `capability.updated`, `account.external_account.created`, `person.created`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET_CONNECTED`

## Local Development Setup

Run two separate Stripe CLI instances:

**Terminal 1 (Personal Account Events):**
```bash
stripe listen --forward-to localhost:3000/api/v1/stripe/webhook --events checkout.session.completed,payment_intent.succeeded,charge.succeeded
```

**Terminal 2 (Connected Account Events):**
```bash
stripe listen --forward-to localhost:3000/api/v1/stripe/webhook --events account.updated,capability.updated,account.external_account.created,person.created --connect
```

## Benefits

1. **Security**: Each webhook type uses its own secret, reducing risk
2. **Clarity**: Clear separation between order processing and vendor onboarding
3. **Debugging**: Easier to track which type of event is being processed
4. **Scalability**: Can be easily extended for additional webhook types

## Event Flow

### Checkout Flow (PERSONAL)
1. User completes checkout
2. Stripe sends `checkout.session.completed` event
3. Webhook verifies using PERSONAL secret
4. Orders are created in Firestore
5. User's cart is cleared

### Vendor Onboarding Flow (CONNECTED)
1. Vendor completes Stripe onboarding
2. Stripe sends `account.updated` or `capability.updated` events
3. Webhook verifies using CONNECTED secret
4. Vendor document is created in Firestore
5. User status is updated to completed

## Troubleshooting

### Common Issues
1. **Wrong secret used**: Check event type matches expected webhook secret
2. **Missing secrets**: Ensure both secrets are configured in environment
3. **CLI not forwarding**: Make sure both CLI instances are running
4. **Event not handled**: Verify event type is included in webhook configuration

### Debug Commands
```bash
# Test configuration
node test-webhook-secrets.js

# Check webhook delivery in Stripe Dashboard
# Go to Developers → Webhooks → [Your webhook] → Recent deliveries
```

## Migration Notes

If upgrading from single webhook secret:
1. Add both new environment variables
2. Update webhook configuration in Stripe Dashboard
3. Test both checkout and vendor onboarding flows
4. Remove old `STRIPE_WEBHOOK_SECRET` variable after testing 
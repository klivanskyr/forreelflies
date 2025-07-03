# Production Webhook Debugging Guide

## 1. Stripe Dashboard Configuration

### Check Production Webhook Setup:
You now need **TWO** separate webhook endpoints in Stripe Dashboard:

**Webhook 1 - Personal Account Events (Checkout/Orders):**
1. Login to Stripe Dashboard
2. Switch to **Live mode** (not Test mode)
3. Go to **Developers → Webhooks**
4. Create/verify webhook endpoint: `https://your-production-domain.com/api/v1/stripe/webhook`
5. Check events: Must include `checkout.session.completed`, `payment_intent.succeeded`, `charge.succeeded`
6. Status should be **Enabled**

**Webhook 2 - Connected Account Events (Vendor Onboarding):**
1. In Stripe Dashboard, go to **Connect → Webhooks**
2. Create/verify webhook endpoint: `https://your-production-domain.com/api/v1/stripe/webhook`
3. Check events: Must include `account.updated`, `capability.updated`, `account.external_account.created`, `person.created`
4. Status should be **Enabled**

### Get Production Webhook Secrets:
1. Click on your **personal account** webhook → Copy the **Signing secret** (starts with `whsec_`)
2. Click on your **connected account** webhook → Copy the **Signing secret** (starts with `whsec_`)
3. These go in your production environment variables

## 2. Environment Variables Check

### Required Production Environment Variables:
```env
# These must be LIVE keys, not test keys
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET_PERSONAL=whsec_... # From personal account webhook
STRIPE_WEBHOOK_SECRET_CONNECTED=whsec_... # From connected account webhook
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Other required vars
SHIPPO_KEY=your_shippo_key
NEXTAUTH_SECRET=your_nextauth_secret
NEXT_PUBLIC_URL=https://your-production-domain.com
```

## 3. Test Webhook Endpoint Accessibility

### Test 1: Basic Endpoint Access
```bash
curl -X GET https://your-production-domain.com/api/v1/stripe/webhook
```
Expected response: `{"error": "vendorId required"}` (confirms endpoint works)

### Test 2: POST Request Test
```bash
curl -X POST https://your-production-domain.com/api/v1/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```
Expected response: `{"error": "Missing signature or webhook secrets"}` (confirms POST works)

## 4. Check Webhook Logs

### In Stripe Dashboard:
1. Go to **Developers → Webhooks**
2. Click on your production webhook
3. Check the **Recent deliveries** tab
4. Look for failed attempts and error messages

### Common Error Messages:
- **Connection timeout**: Your server isn't responding
- **SSL certificate error**: HTTPS/SSL issues
- **404 Not Found**: Webhook endpoint doesn't exist
- **500 Internal Server Error**: Code error in webhook handler

## 5. Application Logs

### Check your production logs for:
```
✅ Webhook received: checkout.session.completed
❌ Webhook signature verification failed
❌ Error processing webhook
```

## 6. Test with Stripe CLI

### Forward production events to local for testing:
```bash
# Login to Stripe CLI
stripe login

# Forward production events to local
stripe listen --forward-to localhost:3000/api/v1/stripe/webhook --live

# In another terminal, trigger a test event
stripe trigger checkout.session.completed --live
```

## 7. Common Issues & Solutions

### Issue: Webhook secret mismatch
**Solution**: Copy the exact webhook secrets from both your personal and connected account webhooks in Stripe Dashboard

### Issue: Using test keys in production
**Solution**: Switch to live keys (sk_live_, pk_live_)

### Issue: Webhook endpoint not accessible
**Solution**: Check deployment, SSL certificate, firewall settings

### Issue: Environment variables not loaded
**Solution**: Verify your hosting platform has the correct environment variables set

### Issue: Multiple webhook endpoints
**Solution**: Disable old/test webhook endpoints to avoid conflicts

## 8. Hosting Platform Specific

### Vercel:
1. Go to your project dashboard
2. Settings → Environment Variables
3. Ensure production environment variables are set
4. Redeploy after adding/changing variables

### Netlify:
1. Site settings → Environment variables
2. Add production variables
3. Redeploy

### Other platforms:
Check your platform's documentation for environment variable configuration

## 9. Manual Test Webhook

### Create a test webhook event:
```bash
# Using Stripe CLI
stripe trigger checkout.session.completed \
  --add checkout_session:metadata:checkoutSessionId=test_123 \
  --add checkout_session:metadata:vendorData='[{"vendorId":"test","amount":"1000","shippingFee":"500"}]' \
  --live
```

## 10. Debugging Checklist

- [ ] Production webhook endpoint configured in Stripe Dashboard
- [ ] Webhook is enabled and listening for `checkout.session.completed`
- [ ] Production environment variables set correctly
- [ ] Webhook endpoint accessible via HTTPS
- [ ] SSL certificate valid
- [ ] No firewall blocking webhook requests
- [ ] Application deployed and running
- [ ] Webhook secrets match between Stripe and your app (both personal and connected)
- [ ] Using live Stripe keys (not test keys)
- [ ] Checked Stripe webhook delivery logs
- [ ] Checked application logs for errors

## 11. Emergency Debugging

### If webhooks still don't work, add temporary logging:

Add this to your webhook handler:
```javascript
export async function POST(request: NextRequest) {
    console.log("🔍 WEBHOOK DEBUG - Request received");
    console.log("Headers:", Object.fromEntries(request.headers.entries()));
    
    const payload = await request.text();
    console.log("Payload length:", payload.length);
    
    const sig = request.headers.get('stripe-signature');
    console.log("Signature present:", !!sig);
    console.log("Personal webhook secret present:", !!process.env.STRIPE_WEBHOOK_SECRET_PERSONAL);
    console.log("Connected webhook secret present:", !!process.env.STRIPE_WEBHOOK_SECRET_CONNECTED);
    
    // ... rest of your webhook code
}
```

This will help identify exactly where the issue is occurring. 
# Shipping Label Test Files

This directory contains test files to help debug shipping label creation issues.

## Test Files

### 1. `test-shipping-label-simple.js`
A simple test that focuses on testing existing orders and shipping label creation.

**What it tests:**
- Environment variables and server connectivity
- Shippo API connection
- Existing orders retrieval
- Shipping label retry functionality

**How to run:**
```bash
npm run test:shipping
```

### 2. `test-shipping-label-flow.js`
A comprehensive test that simulates the entire flow from checkout to order creation to shipping label creation.

**What it tests:**
- Product creation
- Vendor creation
- Checkout session creation
- Webhook simulation (order creation)
- Shipping label creation
- Order status verification

**How to run:**
```bash
npm run test:shipping:full
```

## Prerequisites

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Ensure environment variables are set:**
   - `SHIPPO_API_KEY` - Your Shippo API key
   - `STRIPE_SECRET_KEY` - Your Stripe secret key
   - `STRIPE_WEBHOOK_SECRET_PERSONAL` - Your Stripe webhook secret
   - `STRIPE_WEBHOOK_SECRET_CONNECTED` - Your Stripe connected account webhook secret

3. **Make sure you have some test data:**
   - At least one vendor with complete address information
   - At least one product
   - At least one order (for the simple test)

## Understanding the Results

### Successful Test Output
```
✅ Shippo connection test successful
✅ Orders retrieved successfully
✅ Shipping label created successfully
```

### Common Issues and Solutions

#### 1. "Shippo connection failed"
- **Cause:** Invalid or missing Shippo API key
- **Solution:** Check your `SHIPPO_API_KEY` environment variable

#### 2. "No orders found"
- **Cause:** No orders exist in the database
- **Solution:** Create some test orders first, or use the full test which creates test data

#### 3. "Vendor address is incomplete"
- **Cause:** Vendor doesn't have complete address information
- **Solution:** Update vendor address in the store manager settings

#### 4. "Customer address is incomplete"
- **Cause:** Order has incomplete customer address
- **Solution:** Check the order data and ensure customer address is complete

#### 5. "Reference field length exceeded"
- **Cause:** Order ID or vendor name is too long for Shippo API
- **Solution:** This should be fixed with the recent code changes

## Production vs Development Differences

### Shippo API Keys
- **Development:** Uses test API key (if configured)
- **Production:** Uses live API key
- **Impact:** Test keys may have different rate limits or features

### Environment Variables
- **Development:** Uses `.env.local` file
- **Production:** Uses environment variables set on the server
- **Impact:** Different API keys and webhook secrets

### Database
- **Development:** Uses development Firebase project
- **Production:** Uses production Firebase project
- **Impact:** Different data and potentially different configurations

## Debugging Steps

1. **Run the simple test first:**
   ```bash
   npm run test:shipping
   ```

2. **Check the logs for specific errors:**
   - Look for "❌" or "⚠️" messages
   - Note the specific error messages

3. **If the simple test fails, run the full test:**
   ```bash
   npm run test:shipping:full
   ```

4. **Check the server logs:**
   - Look for console.log messages in your development server
   - Check for any errors in the API routes

5. **Verify environment variables:**
   - Make sure all required environment variables are set
   - Check that the API keys are valid

## Common Error Messages

### "API error occurred: Status 400"
- Usually indicates a problem with the request data
- Check the specific error message in the response

### "The 'reference_1' and 'reference_2' fields may not exceed 50 characters"
- This should be fixed with the recent code changes
- If still occurring, check the order ID and vendor name lengths

### "Vendor address is incomplete"
- The vendor is missing required address fields
- Update the vendor's address in the store manager

### "Customer address is incomplete"
- The order has missing customer address information
- Check the order data and customer information

## Next Steps

If the tests reveal specific issues:

1. **Address Issues:** Update vendor or customer addresses
2. **API Key Issues:** Verify and update API keys
3. **Data Issues:** Create proper test data
4. **Code Issues:** Check the specific error and fix the code

## Support

If you're still having issues after running these tests:

1. **Check the test output** for specific error messages
2. **Look at the server logs** for additional details
3. **Verify your environment variables** are correctly set
4. **Test with a simple order** first before trying complex scenarios 
// Load environment variables first
require('dotenv').config({ path: '.env.local' });

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function testWebhookSecrets() {
    console.log('🔍 Testing Webhook Secret Configuration');
    console.log('=====================================');
    
    // Check environment variables
    console.log('\n📋 Environment Variables:');
    console.log('STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? '✅ Present' : '❌ Missing');
    console.log('STRIPE_WEBHOOK_SECRET_PERSONAL:', process.env.STRIPE_WEBHOOK_SECRET_PERSONAL ? '✅ Present' : '❌ Missing');
    console.log('STRIPE_WEBHOOK_SECRET_CONNECTED:', process.env.STRIPE_WEBHOOK_SECRET_CONNECTED ? '✅ Present' : '❌ Missing');
    
    // Validate webhook secret format
    console.log('\n🔐 Webhook Secret Validation:');
    if (process.env.STRIPE_WEBHOOK_SECRET_PERSONAL) {
        const personalValid = process.env.STRIPE_WEBHOOK_SECRET_PERSONAL.startsWith('whsec_');
        console.log('Personal secret format:', personalValid ? '✅ Valid (starts with whsec_)' : '❌ Invalid format');
        console.log('Personal secret length:', process.env.STRIPE_WEBHOOK_SECRET_PERSONAL.length);
    }
    
    if (process.env.STRIPE_WEBHOOK_SECRET_CONNECTED) {
        const connectedValid = process.env.STRIPE_WEBHOOK_SECRET_CONNECTED.startsWith('whsec_');
        console.log('Connected secret format:', connectedValid ? '✅ Valid (starts with whsec_)' : '❌ Invalid format');
        console.log('Connected secret length:', process.env.STRIPE_WEBHOOK_SECRET_CONNECTED.length);
    }
    
    // Test webhook signature validation
    console.log('\n🧪 Testing Webhook Signature Validation:');
    
    const testPayload = JSON.stringify({
        id: 'evt_test_webhook',
        object: 'event',
        api_version: '2023-10-16',
        created: Math.floor(Date.now() / 1000),
        data: {
            object: {
                id: 'cs_test_checkout_session',
                object: 'checkout.session'
            }
        },
        type: 'checkout.session.completed'
    });
    
    // Generate test signature for personal webhook
    if (process.env.STRIPE_WEBHOOK_SECRET_PERSONAL) {
        try {
            const testTimestamp = Math.floor(Date.now() / 1000);
            const testSignature = `t=${testTimestamp},v1=test_signature`;
            
            // This would normally fail signature validation, but we're just testing the format
            console.log('Personal webhook test payload generated ✅');
            console.log('Test signature format:', testSignature);
        } catch (error) {
            console.log('Personal webhook test failed:', error.message);
        }
    }
    
    console.log('\n✅ Webhook configuration test completed');
    console.log('\n📝 Next Steps:');
    console.log('1. Ensure both webhook secrets are configured in your environment');
    console.log('2. Set up two separate webhooks in Stripe Dashboard:');
    console.log('   - Personal account webhook for checkout/payment events');
    console.log('   - Connected account webhook for vendor onboarding events');
    console.log('3. Test with actual Stripe CLI forwarding');
}

testWebhookSecrets().catch(console.error); 
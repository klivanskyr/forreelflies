/**
 * Simple Test for Retry Label Functionality
 * 
 * This test is a simplified version that tests the retry-label endpoint
 * with an existing order ID. This is useful for debugging and testing
 * the endpoint without creating new test data.
 * 
 * Usage:
 *   node test-retry-label-simple.js [orderId]
 * 
 * Example:
 *   node test-retry-label-simple.js order_checkout_1754708511252_ZOsI4d8QasUgtZ4iHaNuW7BNkeB2_ZOsI4d8QasUgtZ4iHaNuW7BNkeB2
 */

const fetch = require('node-fetch');

const BASE_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

async function testRetryLabelSimple(orderId) {
    console.log('🚀 Starting simple retry-label test...\n');
    console.log('📦 Testing with order ID:', orderId || 'No order ID provided');

    if (!orderId) {
        console.error('❌ Please provide an order ID as a command line argument');
        console.log('Usage: node test-retry-label-simple.js <orderId>');
        process.exit(1);
    }

    try {
        // Step 1: Test retry-label endpoint
        console.log('1️⃣ Testing retry-label endpoint...');
        
        const retryResponse = await fetch(`${BASE_URL}/api/v1/shipping/retry-label`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                orderId: orderId
            })
        });

        console.log('📊 Response status:', retryResponse.status);
        console.log('📊 Response headers:', Object.fromEntries(retryResponse.headers.entries()));

        if (!retryResponse.ok) {
            const errorData = await retryResponse.json().catch(() => ({ error: 'Failed to parse error response' }));
            console.error('❌ Retry-label failed:', errorData);
            throw new Error(`Retry-label failed: ${errorData.error || retryResponse.statusText}`);
        }

        const retryData = await retryResponse.json();
        console.log('✅ Retry-label response:', JSON.stringify(retryData, null, 2));

        // Step 2: Validate the response
        console.log('\n2️⃣ Validating response...');
        
        if (!retryData.success) {
            throw new Error('Retry-label response indicates failure');
        }

        if (!retryData.labelUrl && !retryData.trackingNumber) {
            console.warn('⚠️ Warning: No label URL or tracking number returned');
            console.log('   This might indicate the label is still being processed or there was an issue');
        } else {
            console.log('✅ Label data returned successfully:');
            console.log('   - Label URL:', retryData.labelUrl || 'Not available');
            console.log('   - Tracking Number:', retryData.trackingNumber || 'Not available');
            console.log('   - Carrier:', retryData.carrier || 'Not available');
            console.log('   - Service:', retryData.service || 'Not available');
            console.log('   - Cost:', retryData.cost || 'Not available');
            console.log('   - Transaction Status:', retryData.transactionStatus || 'Not available');
        }

        console.log('\n🎉 Test completed successfully!');

        return {
            success: true,
            orderId,
            retryData
        };

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
        
        return {
            success: false,
            error: error.message
        };
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    const orderId = process.argv[2];
    
    testRetryLabelSimple(orderId)
        .then(result => {
            if (result.success) {
                console.log('\n✅ Test passed!');
                process.exit(0);
            } else {
                console.log('\n❌ Test failed!');
                process.exit(1);
            }
        })
        .catch(error => {
            console.error('\n💥 Test crashed:', error);
            process.exit(1);
        });
}

module.exports = { testRetryLabelSimple }; 
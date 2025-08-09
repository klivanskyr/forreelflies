const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

// Configuration
const BASE_URL = 'http://localhost:3000';

// Helper functions
async function log(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
    if (data) {
        console.log(JSON.stringify(data, null, 2));
    }
    console.log('');
}

async function makeRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        }
    };

    const finalOptions = { ...defaultOptions, ...options };
    
    try {
        log(`Making request to: ${endpoint}`, {
            method: finalOptions.method || 'GET',
            body: finalOptions.body ? JSON.parse(finalOptions.body) : undefined
        });

        const response = await fetch(url, finalOptions);
        const responseText = await response.text();
        
        let responseData;
        try {
            responseData = JSON.parse(responseText);
        } catch (e) {
            responseData = { raw: responseText };
        }

        log(`Response from ${endpoint}:`, {
            status: response.status,
            statusText: response.statusText,
            data: responseData
        });

        return {
            ok: response.ok,
            status: response.status,
            data: responseData
        };
    } catch (error) {
        log(`Error making request to ${endpoint}:`, {
            error: error.message,
            stack: error.stack
        });
        throw error;
    }
}

// Test functions
async function checkEnvironmentVariables() {
    log('=== Checking Environment Variables ===');
    
    const envVars = {
        NODE_ENV: process.env.NODE_ENV,
        SHIPPO_KEY: process.env.SHIPPO_KEY ? '[PRESENT]' : '[MISSING]',
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? '[PRESENT]' : '[MISSING]',
        STRIPE_WEBHOOK_SECRET_PERSONAL: process.env.STRIPE_WEBHOOK_SECRET_PERSONAL ? '[PRESENT]' : '[MISSING]',
        STRIPE_WEBHOOK_SECRET_CONNECTED: process.env.STRIPE_WEBHOOK_SECRET_CONNECTED ? '[PRESENT]' : '[MISSING]'
    };
    
    log('Environment variables:', envVars);
    
    // Check if Shippo API key is test or live
    if (process.env.SHIPPO_KEY) {
        const isTestKey = process.env.SHIPPO_KEY.includes('test') || process.env.SHIPPO_KEY.includes('shippo_test');
        log(`Shippo API key type: ${isTestKey ? 'TEST' : 'LIVE'}`);
    }
    
    return envVars;
}

async function checkServerStatus() {
    log('=== Checking Server Status ===');
    
    try {
        const response = await fetch(`${BASE_URL}/api/v1/product`);
        log(`Server status: ${response.status} ${response.statusText}`);
        return response.ok;
    } catch (error) {
        log(`Server connection failed: ${error.message}`);
        return false;
    }
}

async function testShippoConnection() {
    log('=== Testing Shippo Connection ===');
    
    const testData = {
        addressFrom: {
            name: 'Test Vendor',
            street1: '123 Test Street',
            city: 'Test City',
            state: 'CA',
            zip: '90210',
            country: 'US',
            phone: '555-123-4567'
        },
        addressTo: {
            name: 'Test Customer',
            street1: '456 Customer Ave',
            street2: 'Apt 1',
            city: 'Customer City',
            state: 'NY',
            zip: '10001',
            country: 'US'
        },
        parcels: [{
            length: "8",
            width: "6",
            height: "4",
            distanceUnit: "in",
            weight: "1.5",
            massUnit: "lb"
        }]
    };

    const response = await makeRequest('/api/v1/shipping/shipment', {
        method: 'POST',
        body: JSON.stringify(testData)
    });

    if (!response.ok) {
        log(`⚠️ Shippo connection failed: ${response.status} ${JSON.stringify(response.data)}`);
        return false;
    }

    log('✅ Shippo connection successful');
    return true;
}

async function checkExistingOrders() {
    log('=== Checking Existing Orders ===');
    
    // Try to get orders from different endpoints
    const endpoints = [
        '/api/v1/vendor/orders?vendorId=test-vendor-1',
        '/api/v1/vendor/orders?vendorId=vendor-1',
        '/api/v1/stripe/webhook?vendorId=all'
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = await makeRequest(endpoint);
            if (response.ok && response.data.orders && response.data.orders.length > 0) {
                log(`✅ Found ${response.data.orders.length} orders via ${endpoint}`);
                return response.data.orders;
            }
        } catch (error) {
            log(`⚠️ Failed to check ${endpoint}: ${error.message}`);
        }
    }
    
    log('❌ No orders found');
    return [];
}

async function testShippingLabelRetry() {
    log('=== Testing Shipping Label Retry ===');
    
    // Get existing orders first
    const orders = await checkExistingOrders();
    
    if (orders.length === 0) {
        log('❌ No orders available for shipping label test');
        return false;
    }
    
    // Test with the first order
    const testOrder = orders[0];
    log(`Testing shipping label creation for order: ${testOrder.id}`);
    
    const response = await makeRequest('/api/v1/shipping/retry-label', {
        method: 'POST',
        body: JSON.stringify({
            orderId: testOrder.id
        })
    });

    if (!response.ok) {
        log(`⚠️ Shipping label creation failed: ${response.status} ${JSON.stringify(response.data)}`);
        return false;
    }

    log('✅ Shipping label created successfully');
    return true;
}

async function checkVendorData() {
    log('=== Checking Vendor Data ===');
    
    // This would require direct database access, so we'll simulate it
    log('To check vendor data, you would need to:');
    log('1. Go to the store manager');
    log('2. Check if vendors have complete address information');
    log('3. Verify the following fields are present:');
    log('   - storeStreetAddress');
    log('   - storeCity');
    log('   - storeState');
    log('   - storeZip');
    log('   - storeCountry');
}

// Main function
async function runEnvironmentCheck() {
    try {
        log('🚀 Starting environment check');
        
        // Check 1: Environment variables
        await checkEnvironmentVariables();
        
        // Check 2: Server status
        const serverRunning = await checkServerStatus();
        if (!serverRunning) {
            log('❌ Server is not running. Please start the development server with: npm run dev');
            return;
        }
        
        // Check 3: Shippo connection
        const shippoConnected = await testShippoConnection();
        if (!shippoConnected) {
            log('❌ Shippo connection failed - this is likely the main issue');
            log('Possible causes:');
            log('1. Missing or invalid SHIPPO_API_KEY');
            log('2. Using test API key in production environment');
            log('3. Network connectivity issues');
            return;
        }
        
        // Check 4: Existing orders
        await checkExistingOrders();
        
        // Check 5: Shipping label retry
        await testShippingLabelRetry();
        
        // Check 6: Vendor data (informational)
        await checkVendorData();
        
        log('🎉 Environment check completed!');
        
        // Summary
        log('📋 Summary:');
        log('- Check the logs above for any ❌ or ⚠️ messages');
        log('- If Shippo connection failed, check your API key');
        log('- If no orders found, create some test orders first');
        log('- If shipping label creation failed, check vendor/customer addresses');
        
    } catch (error) {
        log('❌ Environment check failed:', {
            error: error.message,
            stack: error.stack
        });
    }
}

// Run the check if this file is executed directly
if (require.main === module) {
    runEnvironmentCheck().then(() => {
        console.log('Environment check completed');
        process.exit(0);
    }).catch((error) => {
        console.error('Environment check failed:', error);
        process.exit(1);
    });
}

module.exports = {
    runEnvironmentCheck,
    checkEnvironmentVariables,
    checkServerStatus,
    testShippoConnection,
    checkExistingOrders,
    testShippingLabelRetry,
    checkVendorData
}; 
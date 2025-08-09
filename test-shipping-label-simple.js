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
async function testGetAllOrders() {
    log('=== Testing Get All Orders ===');
    
    // Get all orders from the webhook endpoint
    const response = await makeRequest('/api/v1/stripe/webhook?vendorId=all');
    
    if (!response.ok) {
        log(`⚠️ Failed to get orders: ${response.status} ${JSON.stringify(response.data)}`);
        return [];
    }

    log('✅ Orders retrieved successfully');
    return response.data.orders || [];
}

async function testGetVendorOrders(vendorId) {
    log(`=== Testing Get Vendor Orders for ${vendorId} ===`);
    
    const response = await makeRequest(`/api/v1/vendor/orders?vendorId=${vendorId}`);
    
    if (!response.ok) {
        log(`⚠️ Failed to get vendor orders: ${response.status} ${JSON.stringify(response.data)}`);
        return [];
    }

    const orders = response.data.orders || [];
    log(`✅ Found ${orders.length} orders for vendor ${vendorId}`);
    
    orders.forEach(order => {
        log(`Order ${order.id}:`, {
            shippingStatus: order.shippingStatus,
            shippoLabelUrl: order.shippoLabelUrl,
            trackingNumber: order.trackingNumber,
            shippingError: order.shippingError,
            vendorId: order.vendorId,
            customerEmail: order.customerEmail
        });
    });

    return orders;
}

async function testRetryShippingLabelForOrder(orderId) {
    log(`=== Testing Shipping Label Retry for Order ${orderId} ===`);
    
    const response = await makeRequest('/api/v1/shipping/retry-label', {
        method: 'POST',
        body: JSON.stringify({
            orderId: orderId
        })
    });

    if (!response.ok) {
        log(`⚠️ Shipping label creation failed: ${response.status} ${JSON.stringify(response.data)}`);
        return response.data;
    }

    log('✅ Shipping label created successfully');
    return response.data;
}

async function testShippoConnection() {
    log('=== Testing Shippo API Connection ===');
    
    const testAddresses = {
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
        body: JSON.stringify(testAddresses)
    });

    if (!response.ok) {
        log(`⚠️ Shippo connection test failed: ${response.status} ${JSON.stringify(response.data)}`);
        return false;
    }

    log('✅ Shippo connection test successful');
    return true;
}

async function testCreateTestOrder() {
    log('=== Testing Create Test Order ===');
    
    // Create a test order directly in the database
    const testOrder = {
        id: 'test_order_' + Date.now(),
        vendorId: 'test-vendor-1',
        vendorName: 'Test Vendor Store',
        customerId: 'test-customer-1',
        customerEmail: 'test@example.com',
        customerName: 'Test Customer',
        subtotal: 29.99,
        amount: 34.99,
        shippingCost: 5.00,
        products: [{
            productId: 'test-product-1',
            productName: 'Test Product',
            productImage: 'https://example.com/image.jpg',
            quantity: 1,
            price: 29.99
        }],
        shippingAddress: {
            name: 'Test Customer',
            address1: '456 Customer Ave',
            address2: 'Apt 1',
            city: 'Customer City',
            state: 'NY',
            zip: '10001',
            country: 'US'
        },
        shippingStatus: 'pending',
        status: 'pending',
        deliveryStatus: 'pending',
        payoutStatus: 'pending_delivery',
        purchaseDate: new Date(),
        withdrawAvailableDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        platformFee: 2.99,
        vendorEarnings: 26.99,
        checkoutSessionId: 'test_session_' + Date.now()
    };

    // This would require direct database access, so we'll simulate it
    log('✅ Test order data prepared (would need direct DB access to create)');
    return testOrder;
}

async function testEnvironment() {
    log('=== Testing Environment ===');
    
    log('Environment variables:', {
        NODE_ENV: process.env.NODE_ENV,
        SHIPPO_KEY: process.env.SHIPPO_KEY ? '[PRESENT]' : '[MISSING]',
        STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY ? '[PRESENT]' : '[MISSING]',
        STRIPE_WEBHOOK_SECRET_PERSONAL: process.env.STRIPE_WEBHOOK_SECRET_PERSONAL ? '[PRESENT]' : '[MISSING]',
        STRIPE_WEBHOOK_SECRET_CONNECTED: process.env.STRIPE_WEBHOOK_SECRET_CONNECTED ? '[PRESENT]' : '[MISSING]'
    });

    // Test if the server is running
    try {
        const response = await fetch(`${BASE_URL}/api/v1/product`);
        log(`Server status: ${response.status} ${response.statusText}`);
    } catch (error) {
        log(`Server connection failed: ${error.message}`);
    }
}

// Main test function
async function runSimpleTest() {
    try {
        log('🚀 Starting simple shipping label test');
        
        // Test 1: Check environment
        await testEnvironment();
        
        // Test 2: Check Shippo connection
        const shippoConnected = await testShippoConnection();
        if (!shippoConnected) {
            log('❌ Shippo connection failed - this might be the issue');
            return;
        }
        
        // Test 3: Get all orders
        const allOrders = await testGetAllOrders();
        
        // Test 4: Get vendor orders (try a few common vendor IDs)
        const vendorIds = ['test-vendor-1', 'vendor-1', 'test-vendor'];
        let vendorOrders = [];
        
        for (const vendorId of vendorIds) {
            const orders = await testGetVendorOrders(vendorId);
            if (orders.length > 0) {
                vendorOrders = orders;
                break;
            }
        }
        
        if (vendorOrders.length === 0) {
            log('❌ No orders found - you may need to create some test orders first');
            return;
        }
        
        // Test 5: Try to create shipping label for each order
        for (const order of vendorOrders) {
            log(`Testing shipping label creation for order: ${order.id}`);
            await testRetryShippingLabelForOrder(order.id);
            
            // Wait a bit between requests
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        // Test 6: Check final status
        for (const vendorId of vendorIds) {
            await testGetVendorOrders(vendorId);
        }
        
        log('🎉 Simple test completed!');

    } catch (error) {
        log('❌ Test failed:', {
            error: error.message,
            stack: error.stack
        });
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    runSimpleTest().then(() => {
        console.log('Simple test script completed');
        process.exit(0);
    }).catch((error) => {
        console.error('Simple test script failed:', error);
        process.exit(1);
    });
}

module.exports = {
    runSimpleTest,
    testGetAllOrders,
    testGetVendorOrders,
    testRetryShippingLabelForOrder,
    testShippoConnection,
    testEnvironment
}; 
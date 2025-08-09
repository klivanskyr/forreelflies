const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.local' });

// Configuration
const BASE_URL = 'http://localhost:3000';
const TEST_USER_EMAIL = 'test@example.com';
const TEST_USER_PASSWORD = 'testpassword123';

// Test data
const testProduct = {
    id: 'test-product-1',
    name: 'Test Product',
    price: 29.99,
    description: 'A test product for shipping label testing',
    vendorId: 'test-vendor-1',
    vendorName: 'Test Vendor Store',
    shippingWeight: 1.5,
    shippingLength: 8,
    shippingWidth: 6,
    shippingHeight: 4
};

const testVendor = {
    id: 'test-vendor-1',
    storeName: 'Test Vendor Store',
    storeEmail: 'vendor@test.com',
    storePhone: '555-123-4567',
    storeStreetAddress: '123 Test Street',
    storeCity: 'Test City',
    storeState: 'CA',
    storeZip: '90210',
    storeCountry: 'US',
    storeDescription: 'A test vendor for shipping label testing'
};

const testCustomer = {
    email: 'customer@test.com',
    name: 'Test Customer',
    address: {
        line1: '456 Customer Ave',
        line2: 'Apt 1',
        city: 'Customer City',
        state: 'NY',
        postal_code: '10001',
        country: 'US'
    }
};

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
async function testCreateProduct() {
    log('=== Testing Product Creation ===');
    
    const productData = {
        ...testProduct,
        shortDescription: 'A test product for shipping label testing',
        longDescription: 'This is a test product used to verify shipping label creation works properly.',
        tags: ['test', 'shipping'],
        categories: ['test-category'],
        stockStatus: 'inStock',
        stockQuantity: 100,
        trackQuantity: true,
        lowStockThreshold: 10,
        quantityOptions: [1, 2, 3, 5, 10],
        isDraft: false
    };

    const response = await makeRequest('/api/v1/product', {
        method: 'POST',
        body: JSON.stringify(productData)
    });

    if (!response.ok) {
        throw new Error(`Failed to create product: ${response.status} ${JSON.stringify(response.data)}`);
    }

    log('✅ Product created successfully');
    return response.data;
}

async function testCreateVendor() {
    log('=== Testing Vendor Creation ===');
    
    const vendorData = {
        ...testVendor,
        ownerId: 'test-user-1',
        ownerName: 'Test Vendor Owner',
        monthlyEarnings: 0,
        allTimeEarnings: 0,
        lastEarningsUpdate: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
    };

    // Create vendor document directly in Firestore (simulating vendor creation)
    const response = await makeRequest('/api/v1/vendor', {
        method: 'POST',
        body: JSON.stringify(vendorData)
    });

    if (!response.ok) {
        throw new Error(`Failed to create vendor: ${response.status} ${JSON.stringify(response.data)}`);
    }

    log('✅ Vendor created successfully');
    return response.data;
}

async function testCreateCheckoutSession() {
    log('=== Testing Checkout Session Creation ===');
    
    const checkoutData = {
        userId: 'test-user-1',
        customerEmail: testCustomer.email,
        shippingAddress: testCustomer.address,
        vendorDetails: [{
            vendorId: testVendor.id,
            vendorName: testVendor.storeName,
            cartItems: [{
                product: testProduct,
                quantity: 2
            }],
            amount: 5998, // $59.98 in cents
            shippingFee: 500, // $5.00 in cents
            productTotal: 5498 // $54.98 in cents
        }]
    };

    const response = await makeRequest('/api/v1/checkout', {
        method: 'POST',
        body: JSON.stringify(checkoutData)
    });

    if (!response.ok) {
        throw new Error(`Failed to create checkout session: ${response.status} ${JSON.stringify(response.data)}`);
    }

    log('✅ Checkout session created successfully');
    return response.data;
}

async function testSimulateWebhook() {
    log('=== Testing Webhook Simulation ===');
    
    // Create a mock webhook payload for checkout.session.completed
    const webhookPayload = {
        id: 'evt_test_webhook',
        object: 'event',
        api_version: '2025-02-24.acacia',
        created: Math.floor(Date.now() / 1000),
        data: {
            object: {
                id: 'cs_test_checkout_session',
                object: 'checkout.session',
                amount_total: 5998,
                currency: 'usd',
                customer_details: {
                    email: testCustomer.email,
                    name: testCustomer.name
                },
                shipping_details: {
                    name: testCustomer.name,
                    address: testCustomer.address
                },
                metadata: {
                    checkoutSessionId: 'test_checkout_session_123',
                    vendorData: JSON.stringify([{
                        vendorId: testVendor.id,
                        vendorName: testVendor.storeName,
                        amount: 5998,
                        shippingFee: 500,
                        productTotal: 5498
                    }])
                },
                payment_status: 'paid',
                status: 'complete'
            }
        },
        livemode: false,
        pending_webhooks: 1,
        request: {
            id: 'req_test_webhook',
            idempotency_key: null
        },
        type: 'checkout.session.completed'
    };

    const response = await makeRequest('/api/v1/stripe/webhook', {
        method: 'POST',
        headers: {
            'stripe-signature': 'test_signature'
        },
        body: JSON.stringify(webhookPayload)
    });

    log('✅ Webhook simulation completed');
    return response.data;
}

async function testRetryShippingLabel() {
    log('=== Testing Shipping Label Retry ===');
    
    // First, let's get the orders to find one to test with
    const ordersResponse = await makeRequest('/api/v1/vendor/orders?vendorId=test-vendor-1');
    
    if (!ordersResponse.ok) {
        throw new Error(`Failed to fetch orders: ${ordersResponse.status} ${JSON.stringify(ordersResponse.data)}`);
    }

    const orders = ordersResponse.data.orders || [];
    if (orders.length === 0) {
        throw new Error('No orders found to test shipping label creation');
    }

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
        return response.data;
    }

    log('✅ Shipping label created successfully');
    return response.data;
}

async function testCheckOrderStatus() {
    log('=== Testing Order Status Check ===');
    
    const ordersResponse = await makeRequest('/api/v1/vendor/orders?vendorId=test-vendor-1');
    
    if (!ordersResponse.ok) {
        throw new Error(`Failed to fetch orders: ${ordersResponse.status} ${JSON.stringify(ordersResponse.data)}`);
    }

    const orders = ordersResponse.data.orders || [];
    
    log('Current orders:', orders.map(order => ({
        id: order.id,
        shippingStatus: order.shippingStatus,
        shippoLabelUrl: order.shippoLabelUrl,
        trackingNumber: order.trackingNumber,
        shippingError: order.shippingError
    })));

    return orders;
}

async function testShippoConnection() {
    log('=== Testing Shippo API Connection ===');
    
    // Test basic Shippo connectivity
    const response = await makeRequest('/api/v1/shipping/shipment', {
        method: 'POST',
        body: JSON.stringify({
            addressFrom: {
                name: testVendor.storeName,
                street1: testVendor.storeStreetAddress,
                city: testVendor.storeCity,
                state: testVendor.storeState,
                zip: testVendor.storeZip,
                country: testVendor.storeCountry,
                phone: testVendor.storePhone
            },
            addressTo: {
                name: testCustomer.name,
                street1: testCustomer.address.line1,
                street2: testCustomer.address.line2,
                city: testCustomer.address.city,
                state: testCustomer.address.state,
                zip: testCustomer.address.postal_code,
                country: testCustomer.address.country
            },
            parcels: [{
                length: "8",
                width: "6",
                height: "4",
                distanceUnit: "in",
                weight: "1.5",
                massUnit: "lb"
            }]
        })
    });

    if (!response.ok) {
        log(`⚠️ Shippo connection test failed: ${response.status} ${JSON.stringify(response.data)}`);
        return false;
    }

    log('✅ Shippo connection test successful');
    return true;
}

// Main test function
async function runFullTest() {
    try {
        log('🚀 Starting comprehensive shipping label flow test');
        log('Environment:', {
            BASE_URL,
            NODE_ENV: process.env.NODE_ENV,
            SHIPPO_KEY: process.env.SHIPPO_KEY ? '[PRESENT]' : '[MISSING]'
        });

        // Test 1: Check Shippo connection
        const shippoConnected = await testShippoConnection();
        if (!shippoConnected) {
            log('❌ Shippo connection failed - stopping test');
            return;
        }

        // Test 2: Create test product
        await testCreateProduct();

        // Test 3: Create test vendor
        await testCreateVendor();

        // Test 4: Create checkout session
        await testCreateCheckoutSession();

        // Test 5: Simulate webhook (order creation)
        await testSimulateWebhook();

        // Test 6: Check order status
        await testCheckOrderStatus();

        // Test 7: Test shipping label retry
        await testRetryShippingLabel();

        // Test 8: Final order status check
        await testCheckOrderStatus();

        log('🎉 All tests completed successfully!');

    } catch (error) {
        log('❌ Test failed:', {
            error: error.message,
            stack: error.stack
        });
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    runFullTest().then(() => {
        console.log('Test script completed');
        process.exit(0);
    }).catch((error) => {
        console.error('Test script failed:', error);
        process.exit(1);
    });
}

module.exports = {
    runFullTest,
    testCreateProduct,
    testCreateVendor,
    testCreateCheckoutSession,
    testSimulateWebhook,
    testRetryShippingLabel,
    testCheckOrderStatus,
    testShippoConnection
}; 
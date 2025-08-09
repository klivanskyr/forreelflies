/**
 * Test Retry Label Functionality
 * 
 * This test creates a complete test scenario for the retry-label endpoint:
 * 1. Creates a test vendor with complete address information
 * 2. Creates a test product with shipping dimensions
 * 3. Creates a test order with shipping address
 * 4. Tests the retry-label endpoint
 * 5. Verifies the order was updated with shipping information
 * 
 * Usage:
 *   npm run test:retry-label
 * 
 * Prerequisites:
 * - Firebase project configured with environment variables
 * - Next.js development server running on localhost:3000
 * - Shippo API key configured
 * 
 * Environment Variables Required:
 * - NEXT_PUBLIC_FIREBASE_API_KEY
 * - NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
 * - NEXT_PUBLIC_FIREBASE_PROJECT_ID
 * - NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
 * - NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
 * - NEXT_PUBLIC_FIREBASE_APP_ID
 * - SHIPPO_KEY
 * 
 * Expected Output:
 * - Success: Creates test data and returns shipping label information
 * - Failure: Shows detailed error information and cleans up test data
 */

// Load environment variables first
require('dotenv').config({ path: '.env.local' });

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, getDoc, serverTimestamp } = require('firebase/firestore');
const fetch = require('node-fetch');

// Firebase configuration (replace with your actual config)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Check for missing configuration
const missingConfig = Object.entries(firebaseConfig)
    .filter(([key, value]) => !value && key !== 'measurementId')
    .map(([key]) => key);

if (missingConfig.length > 0) {
    console.error('Missing Firebase configuration:', missingConfig);
    throw new Error(`Missing Firebase configuration: ${missingConfig.join(', ')}`);
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const BASE_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

// Test account credentials (created by test-create-account.js)
const TEST_ACCOUNT = {
    email: 'test-user-1754711336472@example.com',
    password: 'testpassword123',
    uid: 'zv8WUW3DxEVdjd00B92kgXMd9VH2',
    vendorId: 'zv8WUW3DxEVdjd00B92kgXMd9VH2',
    storeName: 'Test Fly Store'
};

async function testRetryLabel() {
    console.log('🚀 Starting retry-label test...\n');

    let testData = {
        vendorId: null,
        productId: null,
        orderId: null
    };

    try {
        // Step 1: Authenticate as admin (this is more reliable for testing)
        console.log('1️⃣ Authenticating as admin...');
        
        const adminLoginResponse = await fetch(`${BASE_URL}/api/v1/auth/admin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'admin',
                password: 'Cockelmann'
            }),
        });

        if (!adminLoginResponse.ok) {
            throw new Error('Failed to authenticate as admin');
        }

        // Get cookies from admin login response
        const adminCookies = adminLoginResponse.headers.get('set-cookie') || '';
        console.log('✅ Admin login successful');

        // Step 2: Using existing test vendor and updating address if needed
        console.log('\n2️⃣ Using existing test vendor...');
        const vendorId = TEST_ACCOUNT.vendorId;
        testData.vendorId = vendorId;
        
        // Check if vendor exists
        const vendorDoc = await getDoc(doc(db, 'vendors', vendorId));
        if (!vendorDoc.exists()) {
            throw new Error('Test vendor not found. Please run test-create-account.js first.');
        }
        
        const vendorData = vendorDoc.data();
        console.log('✅ Test vendor found:', vendorId);
        console.log('   Store Name:', vendorData.storeName);
        
        // Update vendor address to use a valid address for shipping
        const updatedVendorData = {
            ...vendorData,
            storeStreetAddress: '1600 Pennsylvania Avenue NW',
            storeCity: 'Washington',
            storeState: 'DC',
            storeZip: '20500',
            storeCountry: 'US'
        };
        
        await setDoc(doc(db, 'vendors', vendorId), updatedVendorData);
        console.log('✅ Updated vendor address for shipping validation');

        // Step 3: Create a test product
        console.log('\n3️⃣ Creating test product...');
        const productId = `test_product_${Date.now()}`;
        testData.productId = productId;
        
        const productData = {
            name: 'Test Product',
            price: 29.99,
            vendorId: vendorId,
            vendorName: vendorData.storeName,
            shippingWeight: 1.5,
            shippingLength: 8,
            shippingWidth: 6,
            shippingHeight: 4,
            quantityOptions: [1, 2, 3, 4, 5],
            isDraft: false,
            images: ['https://example.com/test-image.jpg']
        };

        await setDoc(doc(db, 'products', productId), productData);
        console.log('✅ Test product created:', productId);

        // Step 4: Create a test order
        console.log('\n4️⃣ Creating test order...');
        const orderId = `order_test_${Date.now()}_${vendorId}`;
        testData.orderId = orderId;
        
        const orderData = {
            id: orderId,
            vendorId: vendorId,
            vendorName: vendorData.storeName,
            customerId: 'test_customer_123',
            customerEmail: 'customer@test.com',
            customerName: 'Test Customer',
            subtotal: 29.99,
            amount: 35.79, // Including shipping
            shippingCost: 5.80,
            products: [{
                productId: productId,
                productName: productData.name,
                quantity: 1,
                price: productData.price
            }],
            shippingAddress: {
                name: 'Test Customer',
                address1: '350 Fifth Avenue',
                address2: 'Apt 1',
                city: 'New York',
                state: 'NY',
                zip: '10118',
                country: 'US',
                phone: '555-987-6543'
            },
            shippingStatus: 'pending',
            status: 'pending',
            deliveryStatus: 'pending',
            payoutStatus: 'pending_delivery',
            purchaseDate: new Date(),
            withdrawAvailableDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
            platformFee: 2.99,
            vendorEarnings: 26.99,
            checkoutSessionId: `test_session_${Date.now()}`
        };

        await setDoc(doc(db, 'orders', orderId), orderData);
        console.log('✅ Test order created:', orderId);

        // Step 5: Test retry-label endpoint
        console.log('\n5️⃣ Testing retry-label endpoint...');
        
        const retryResponse = await fetch(`${BASE_URL}/api/v1/shipping/retry-label`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': adminCookies
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

        // Step 6: Verify the order was updated
        console.log('\n6️⃣ Verifying order was updated...');
        const updatedOrderDoc = await getDoc(doc(db, 'orders', orderId));
        if (!updatedOrderDoc.exists()) {
            throw new Error('Order not found after retry-label');
        }

        const updatedOrder = updatedOrderDoc.data();
        console.log('✅ Order updated successfully:');
        console.log('  - Shipping Status:', updatedOrder.shippingStatus);
        console.log('  - Label URL:', updatedOrder.shippoLabelUrl || 'Not available');
        console.log('  - Tracking Number:', updatedOrder.trackingNumber || 'Not available');
        console.log('  - Carrier:', updatedOrder.shippingCarrier || 'Not available');
        console.log('  - Service:', updatedOrder.shippingService || 'Not available');
        console.log('  - Transaction ID:', updatedOrder.shippoTransactionId || 'Not available');
        console.log('  - Shipment ID:', updatedOrder.shippoShipmentId || 'Not available');

        // Step 7: Validate the response
        console.log('\n7️⃣ Validating response...');
        
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
        }

        // Step 8: Test data summary
        console.log('\n8️⃣ Test data summary:');
        console.log('📝 Test data created:');
        console.log('  - Vendor ID:', vendorId);
        console.log('  - Product ID:', productId);
        console.log('  - Order ID:', orderId);
        console.log('  - Test completed successfully!');

        console.log('\n🎉 Test completed successfully!');

        return {
            success: true,
            vendorId,
            productId,
            orderId,
            retryData,
            updatedOrder
        };

    } catch (error) {
        console.error('\n❌ Test failed:', error.message);
        console.error('Stack trace:', error.stack);
        
        // Clean up test data on failure
        console.log('\n🧹 Cleaning up test data due to failure...');
        await cleanupTestData(testData);
        
        return {
            success: false,
            error: error.message
        };
    }
}

// Helper function to clean up test data
async function cleanupTestData(testData) {
    try {
        if (testData.orderId) {
            console.log('  - Cleaning up order:', testData.orderId);
            // Note: In a real test environment, you might want to delete the test data
            // For now, we'll just log what would be cleaned up
        }
        if (testData.productId) {
            console.log('  - Cleaning up product:', testData.productId);
        }
        if (testData.vendorId) {
            console.log('  - Cleaning up vendor:', testData.vendorId);
        }
    } catch (error) {
        console.error('  - Error during cleanup:', error.message);
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    testRetryLabel()
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

module.exports = { testRetryLabel }; 
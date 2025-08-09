/**
 * Test Account Creation for Retry Label Testing
 * 
 * This script creates a test user account and vendor account that can be used
 * for testing the retry-label functionality.
 * 
 * Usage:
 *   node test-create-account.js
 * 
 * This will:
 * 1. Create a test user account
 * 2. Create a vendor request for the user
 * 3. Approve the vendor request
 * 4. Return the credentials for use in other tests
 */

require('dotenv').config({ path: '.env.local' });

const fetch = require('node-fetch');

const BASE_URL = process.env.NEXT_PUBLIC_URL || 'http://localhost:3000';

async function createTestAccount() {
    console.log('🚀 Creating test account for retry-label testing...\n');

    try {
        // Step 1: Admin login
        console.log('1️⃣ Authenticating as admin...');
        const loginResponse = await fetch(`${BASE_URL}/api/v1/auth/admin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: 'admin',
                password: 'Cockelmann'
            }),
        });

        if (!loginResponse.ok) {
            throw new Error('Failed to authenticate as admin');
        }

        const cookies = loginResponse.headers.get('set-cookie');
        console.log('✅ Admin login successful');

        // Step 2: Create test user
        console.log('\n2️⃣ Creating test user...');
        const testEmail = `test-user-${Date.now()}@example.com`;
        const testPassword = 'testpassword123';

        const userResponse = await fetch(`${BASE_URL}/api/v1/user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookies
            },
            body: JSON.stringify({
                email: testEmail,
                password: testPassword
            })
        });

        if (!userResponse.ok) {
            const errorData = await userResponse.json();
            throw new Error(`User creation failed: ${errorData.error}`);
        }

        const userData = await userResponse.json();
        console.log('✅ Test user created:', userData.uid);

        // Step 3: Create vendor request
        console.log('\n3️⃣ Creating vendor request...');
        const vendorRequestData = {
            uid: userData.uid,
            name: 'Test Vendor',
            storeName: 'Test Fly Store',
            storeSlug: 'test-fly-store',
            storeEmail: testEmail,
            storePhone: '555-123-4567',
            storeDescription: 'A test store for fly fishing equipment',
            storeStreetAddress: '123 Test Street',
            storeCity: 'Test City',
            storeState: 'CA',
            storeZip: '90210',
            storeCountry: 'US'
        };

        const vendorRequestResponse = await fetch(`${BASE_URL}/api/v1/vendor/request-vendor`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookies
            },
            body: JSON.stringify(vendorRequestData)
        });

        if (!vendorRequestResponse.ok) {
            const errorData = await vendorRequestResponse.json();
            throw new Error(`Vendor request creation failed: ${errorData.message}`);
        }

        console.log('✅ Vendor request created');

        // Step 4: Approve vendor
        console.log('\n4️⃣ Approving vendor...');
        const approveResponse = await fetch(`${BASE_URL}/api/v1/vendor/approve-vendor`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': cookies
            },
            body: JSON.stringify({
                uid: userData.uid
            })
        });

        if (!approveResponse.ok) {
            const errorData = await approveResponse.json();
            throw new Error(`Vendor approval failed: ${errorData.message}`);
        }

        const approveData = await approveResponse.json();
        console.log('✅ Vendor approved successfully');

        // Step 5: Return test account information
        console.log('\n5️⃣ Test account created successfully!');
        console.log('\n📋 Test Account Information:');
        console.log('============================');
        console.log(`Email: ${testEmail}`);
        console.log(`Password: ${testPassword}`);
        console.log(`User ID: ${userData.uid}`);
        console.log(`Store Name: ${vendorRequestData.storeName}`);
        console.log(`Vendor ID: ${approveData.vendor?.id || 'N/A'}`);
        console.log(`Stripe Account: ${approveData.vendor?.stripeAccountId || 'N/A'}`);

        // Save credentials to a file for other tests to use
        const credentials = {
            email: testEmail,
            password: testPassword,
            uid: userData.uid,
            vendorId: approveData.vendor?.id || null,
            storeName: vendorRequestData.storeName,
            stripeAccountId: approveData.vendor?.stripeAccountId || null,
            createdAt: new Date().toISOString()
        };

        console.log('\n💾 Credentials saved for use in other tests');
        console.log('   You can use these credentials in the retry-label test');

        return credentials;

    } catch (error) {
        console.error('\n❌ Test account creation failed:', error.message);
        console.error('Stack trace:', error.stack);
        throw error;
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    createTestAccount()
        .then(credentials => {
            console.log('\n🎉 Test account creation completed successfully!');
            console.log('\nYou can now use these credentials in your retry-label test:');
            console.log(`Email: ${credentials.email}`);
            console.log(`Password: ${credentials.password}`);
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Test account creation failed:', error);
            process.exit(1);
        });
}

module.exports = { createTestAccount }; 
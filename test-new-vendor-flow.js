const admin = require('firebase-admin');
const serviceAccount = require('./forreelflies-9abdb-firebase-adminsdk-91l3l-b3625e6e42.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function testNewVendorFlow() {
    console.log('🧪 Testing new vendor onboarding flow...\n');
    
    try {
        // Test 1: Check if admin approval creates Stripe account
        console.log('1️⃣ Testing admin approval with Stripe account creation...');
        
        // Create a test vendor request
        const testUserId = `test-vendor-${Date.now()}`;
        const testVendorRequest = {
            isApproved: false,
            name: "Test Vendor",
            storeName: "Test Store",
            storeSlug: "test-store",
            storeEmail: "test@example.com",
            storePhone: "555-1234",
            storeDescription: "Test store description",
            storeStreetAddress: "123 Test St",
            storeCity: "Test City",
            storeZip: "12345",
            storeCountry: "US",
            storeState: "CA",
            createdAt: new Date().toISOString(),
        };
        
        await db.collection('vendorRequests').doc(testUserId).set(testVendorRequest);
        await db.collection('users').doc(testUserId).set({
            vendorSignUpStatus: "submittedApprovalForm"
        });
        
        console.log('✅ Test vendor request created');
        
        // Simulate admin approval (this would normally call the API)
        console.log('⚠️ Note: This test requires manual admin approval via API');
        console.log('   Run: POST /api/v1/vendor/approve-vendor with { uid: "' + testUserId + '" }');
        
        // Test 2: Check vendor document structure
        console.log('\n2️⃣ Testing vendor document structure...');
        
        // Wait for manual approval, then check
        console.log('   After approval, vendor document should have:');
        console.log('   - stripeAccountId: (Stripe account ID)');
        console.log('   - hasStripeOnboarding: false');
        console.log('   - vendorSignUpStatus: "vendorActive"');
        
        // Test 3: Check checkout behavior
        console.log('\n3️⃣ Testing checkout behavior...');
        console.log('   - Checkout should allow purchases from vendors with stripeAccountId');
        console.log('   - Even if hasStripeOnboarding is false');
        console.log('   - All transactions tracked under vendor Stripe account');
        
        // Test 4: Check withdrawal behavior
        console.log('\n4️⃣ Testing withdrawal behavior...');
        console.log('   - Withdrawal should be blocked if hasStripeOnboarding is false');
        console.log('   - Should show clear error message with onboarding link');
        
        // Test 5: Check onboarding completion
        console.log('\n5️⃣ Testing onboarding completion...');
        console.log('   - Stripe webhook should update hasStripeOnboarding to true');
        console.log('   - User status should change to "onboardingCompleted"');
        console.log('   - Withdrawals should then be allowed');
        
        console.log('\n✅ Test scenarios defined');
        console.log('\n📋 Manual Testing Steps:');
        console.log('1. Approve the test vendor via admin panel');
        console.log('2. Verify vendor document has stripeAccountId but hasStripeOnboarding: false');
        console.log('3. Test checkout with vendor products');
        console.log('4. Test withdrawal (should be blocked)');
        console.log('5. Complete Stripe onboarding');
        console.log('6. Test withdrawal again (should work)');
        
        // Cleanup
        console.log('\n🧹 Cleanup:');
        console.log('   Test data will be cleaned up after testing');
        console.log('   Test user ID:', testUserId);
        
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

async function cleanupTestData() {
    console.log('\n🧹 Cleaning up test data...');
    
    try {
        // Find and delete test vendor requests
        const testRequests = await db.collection('vendorRequests')
            .where('storeName', '==', 'Test Store')
            .get();
        
        for (const doc of testRequests.docs) {
            await doc.ref.delete();
            console.log('   Deleted vendor request:', doc.id);
        }
        
        // Find and delete test users
        const testUsers = await db.collection('users')
            .where('vendorSignUpStatus', '==', 'submittedApprovalForm')
            .get();
        
        for (const doc of testUsers.docs) {
            if (doc.id.includes('test-vendor-')) {
                await doc.ref.delete();
                console.log('   Deleted test user:', doc.id);
            }
        }
        
        // Find and delete test vendors
        const testVendors = await db.collection('vendors')
            .where('storeName', '==', 'Test Store')
            .get();
        
        for (const doc of testVendors.docs) {
            await doc.ref.delete();
            console.log('   Deleted test vendor:', doc.id);
        }
        
        console.log('✅ Test data cleanup completed');
        
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
    }
}

// Run tests
if (process.argv.includes('--cleanup')) {
    cleanupTestData();
} else {
    testNewVendorFlow();
}
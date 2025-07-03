/**
 * Debug script to check Stripe Connect accounts and identify any that completed
 * onboarding but don't have corresponding vendor documents created.
 * 
 * Usage: node debug-stripe-accounts.js
 */

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
    const serviceAccount = require('./path/to/your/service-account-key.json'); // Update this path
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const db = admin.firestore();

async function checkStripeAccounts() {
    console.log('🔍 Checking Stripe Connect accounts...');
    
    try {
        // Get all Stripe Connect accounts
        const accounts = await stripe.accounts.list({ limit: 100 });
        
        console.log(`Found ${accounts.data.length} Stripe Connect accounts`);
        
        for (const account of accounts.data) {
            const userId = account.metadata?.userId;
            
            if (!userId) {
                console.log(`⚠️ Account ${account.id} has no userId in metadata`);
                continue;
            }
            
            // Check if account is fully onboarded
            const isOnboarded = account.details_submitted && 
                               account.charges_enabled && 
                               account.payouts_enabled;
            
            console.log(`\n📋 Account ${account.id}:`);
            console.log(`   User ID: ${userId}`);
            console.log(`   Details Submitted: ${account.details_submitted}`);
            console.log(`   Charges Enabled: ${account.charges_enabled}`);
            console.log(`   Payouts Enabled: ${account.payouts_enabled}`);
            console.log(`   Fully Onboarded: ${isOnboarded}`);
            
            if (isOnboarded) {
                // Check if vendor exists
                const vendorQuery = await db.collection('vendors')
                    .where('ownerId', '==', userId)
                    .get();
                
                if (vendorQuery.empty) {
                    console.log(`❌ MISSING VENDOR: Account ${account.id} is fully onboarded but no vendor exists!`);
                    
                    // Check if vendor request exists
                    const vendorRequestDoc = await db.collection('vendorRequests').doc(userId).get();
                    if (vendorRequestDoc.exists()) {
                        console.log(`   ✅ Vendor request exists - can create vendor`);
                        console.log(`   📝 To fix: Call handleAccountOnboardingCompleted for account ${account.id}`);
                    } else {
                        console.log(`   ❌ No vendor request found - cannot create vendor`);
                    }
                } else {
                    const vendorData = vendorQuery.docs[0].data();
                    console.log(`   ✅ Vendor exists: ${vendorData.storeName}`);
                    
                    // Check if Stripe account ID is set
                    if (!vendorData.stripeAccountId) {
                        console.log(`   ⚠️ Vendor missing stripeAccountId - should be updated`);
                    }
                }
                
                // Check user status
                const userDoc = await db.collection('users').doc(userId).get();
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    console.log(`   User Status: ${userData.vendorSignUpStatus}`);
                    console.log(`   Is Vendor: ${userData.isVendor}`);
                    
                    if (userData.vendorSignUpStatus !== 'onboardingCompleted') {
                        console.log(`   ⚠️ User status should be 'onboardingCompleted'`);
                    }
                } else {
                    console.log(`   ❌ User document not found`);
                }
            }
        }
        
    } catch (error) {
        console.error('❌ Error checking Stripe accounts:', error);
    }
}

async function manuallyCreateVendor(accountId) {
    console.log(`🔧 Manually creating vendor for account: ${accountId}`);
    
    try {
        // Get the account
        const account = await stripe.accounts.retrieve(accountId);
        const userId = account.metadata?.userId;
        
        if (!userId) {
            console.error('❌ No userId in account metadata');
            return;
        }
        
        // Check if account is fully onboarded
        const isOnboarded = account.details_submitted && 
                           account.charges_enabled && 
                           account.payouts_enabled;
        
        if (!isOnboarded) {
            console.error('❌ Account is not fully onboarded');
            return;
        }
        
        // Check if vendor already exists
        const vendorQuery = await db.collection('vendors')
            .where('ownerId', '==', userId)
            .get();
        
        if (!vendorQuery.empty) {
            console.log('⚠️ Vendor already exists');
            return;
        }
        
        // Get vendor request data
        const vendorRequestDoc = await db.collection('vendorRequests').doc(userId).get();
        if (!vendorRequestDoc.exists()) {
            console.error('❌ No vendor request found');
            return;
        }
        
        const vendorRequestData = vendorRequestDoc.data();
        
        // Create vendor document
        const vendorData = {
            id: userId,
            ownerId: userId,
            ownerName: vendorRequestData.name,
            products: [],
            storeCity: vendorRequestData.storeCity,
            storeCountry: vendorRequestData.storeCountry || "US",
            storeDescription: vendorRequestData.storeDescription,
            storeEmail: vendorRequestData.storeEmail,
            storeName: vendorRequestData.storeName,
            storePhone: vendorRequestData.storePhone,
            storeSlug: vendorRequestData.storeSlug || vendorRequestData.storeName?.toLowerCase().replace(/[^a-z0-9]/g, '-'),
            storeState: vendorRequestData.storeState,
            storeStreetAddress: vendorRequestData.storeStreetAddress,
            storeZip: vendorRequestData.storeZip,
            monthlyEarnings: 0,
            allTimeEarnings: 0,
            lastEarningsUpdate: new Date(),
            stripeAccountId: account.id,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        
        // Save vendor document
        await db.collection('vendors').doc(userId).set(vendorData);
        console.log('✅ Created vendor document');
        
        // Update user status
        await db.collection('users').doc(userId).update({
            vendorSignUpStatus: 'onboardingCompleted',
            isVendor: true
        });
        console.log('✅ Updated user status');
        
        console.log('🎉 Vendor created successfully!');
        
    } catch (error) {
        console.error('❌ Error creating vendor:', error);
    }
}

// Main execution
async function main() {
    const command = process.argv[2];
    const accountId = process.argv[3];
    
    if (command === 'check') {
        await checkStripeAccounts();
    } else if (command === 'create' && accountId) {
        await manuallyCreateVendor(accountId);
    } else {
        console.log('Usage:');
        console.log('  node debug-stripe-accounts.js check          - Check all accounts');
        console.log('  node debug-stripe-accounts.js create <id>    - Manually create vendor for account');
    }
    
    process.exit(0);
}

if (require.main === module) {
    main().catch(console.error);
} 
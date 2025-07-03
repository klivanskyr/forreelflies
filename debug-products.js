// Simple script to check existing products in the database
const admin = require('firebase-admin');
require('dotenv').config({ path: '.env.local' });

// Initialize Firebase Admin SDK using environment variables
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            type: process.env.FIREBASE_ADMIN_TYPE,
            project_id: process.env.FIREBASE_ADMIN_PROJECT_ID,
            private_key_id: process.env.FIREBASE_ADMIN_PRIVATE_KEY_ID,
            private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, '\n'),
            client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
            client_id: process.env.FIREBASE_ADMIN_CLIENT_ID,
            auth_uri: process.env.FIREBASE_ADMIN_AUTH_URI,
            token_uri: process.env.FIREBASE_ADMIN_TOKEN_URI,
            auth_provider_x509_cert_url: process.env.FIREBASE_ADMIN_AUTH_PROVIDER_X509_CERT_URL,
            client_x509_cert_url: process.env.FIREBASE_ADMIN_CLIENT_X509_CERT_URL,
            universe_domain: process.env.FIREBASE_UNIVERSE_DOMAIN
        }),
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID
    });
}

const db = admin.firestore();

async function checkProducts() {
    console.log("🔍 Checking existing products in database...");
    console.log("==========================================");
    
    try {
        const productsSnapshot = await db.collection('products').limit(10).get();
        
        if (productsSnapshot.empty) {
            console.log("❌ No products found in database");
            return;
        }
        
        console.log(`✅ Found ${productsSnapshot.size} products. Details:`);
        
        productsSnapshot.forEach((doc, index) => {
            const productData = doc.data();
            console.log(`\n📦 Product ${index + 1}: ${doc.id}`);
            console.log(`   Name: ${productData.name || 'Unknown'}`);
            console.log(`   Vendor: ${productData.vendorName || 'Unknown'}`);
            console.log(`   Price: $${productData.price || 0}`);
            console.log(`   Is Draft: ${productData.isDraft || false}`);
            console.log(`   Created: ${productData.createdAt?.toDate?.() || productData.createdAt || 'Unknown'}`);
            console.log(`   Images: ${productData.images?.length || 0} images`);
            console.log(`   Categories: ${productData.catagories?.join(', ') || 'None'}`);
            console.log(`   Tags: ${productData.tags?.join(', ') || 'None'}`);
        });
        
    } catch (error) {
        console.error("❌ Error checking products:", error);
    }
}

// Run the check
checkProducts().then(() => {
    console.log("\n✅ Product check complete");
    process.exit(0);
}).catch((error) => {
    console.error("❌ Fatal error:", error);
    process.exit(1);
}); 
// Simple script to check existing orders in the database
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./forreelflies-9abdb-firebase-adminsdk-91l3l-b3625e6e42.json');

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://forreelflies-9abdb-default-rtdb.firebaseio.com"
    });
}

const db = admin.firestore();

async function checkOrders() {
    console.log("🔍 Checking existing orders in database...");
    console.log("==========================================");
    
    try {
        const ordersSnapshot = await db.collection('orders').limit(5).get();
        
        if (ordersSnapshot.empty) {
            console.log("❌ No orders found in database");
            return;
        }
        
        console.log(`✅ Found ${ordersSnapshot.size} orders. Checking first 5:`);
        
        ordersSnapshot.forEach((doc, index) => {
            const orderData = doc.data();
            console.log(`\n📋 Order ${index + 1}: ${doc.id}`);
            console.log(`   Vendor: ${orderData.vendorName || 'Unknown'}`);
            console.log(`   Customer: ${orderData.customerName || 'Unknown'}`);
            console.log(`   Amount: $${orderData.amount || 0}`);
            console.log(`   Items count: ${orderData.items?.length || 0}`);
            
            if (orderData.items && orderData.items.length > 0) {
                console.log(`   Items:`);
                orderData.items.forEach((item, itemIndex) => {
                    console.log(`     ${itemIndex + 1}. ${item.name || 'Unknown'} (Qty: ${item.quantity || 0}, Price: $${item.price || 0})`);
                });
            } else {
                console.log(`   ❌ NO ITEMS FOUND - This order has empty items array!`);
            }
            
            console.log(`   Purchase Date: ${orderData.purchaseDate?.toDate?.() || orderData.purchaseDate || 'Unknown'}`);
            console.log(`   Checkout Session ID: ${orderData.checkoutSessionId || 'None'}`);
        });
        
        console.log("\n🔍 Checking checkout sessions...");
        const checkoutSessionsSnapshot = await db.collection('checkoutSessions').limit(3).get();
        
        if (checkoutSessionsSnapshot.empty) {
            console.log("❌ No checkout sessions found");
        } else {
            console.log(`✅ Found ${checkoutSessionsSnapshot.size} checkout sessions. Checking first 3:`);
            
            checkoutSessionsSnapshot.forEach((doc, index) => {
                const sessionData = doc.data();
                console.log(`\n📦 Checkout Session ${index + 1}: ${doc.id}`);
                console.log(`   User ID: ${sessionData.userId || 'Unknown'}`);
                console.log(`   Vendor Details count: ${sessionData.vendorDetails?.length || 0}`);
                
                if (sessionData.vendorDetails && sessionData.vendorDetails.length > 0) {
                    sessionData.vendorDetails.forEach((vendor, vendorIndex) => {
                        console.log(`     Vendor ${vendorIndex + 1}: ${vendor.vendorName || vendor.vendorId}`);
                        console.log(`       Cart Items count: ${vendor.cartItems?.length || 0}`);
                        
                        if (vendor.cartItems && vendor.cartItems.length > 0) {
                            vendor.cartItems.forEach((item, itemIndex) => {
                                console.log(`         Item ${itemIndex + 1}: ${item.product?.name || 'Unknown'} (Qty: ${item.quantity || 0})`);
                            });
                        } else {
                            console.log(`         ❌ NO CART ITEMS in checkout session!`);
                        }
                    });
                } else {
                    console.log(`   ❌ NO VENDOR DETAILS in checkout session!`);
                }
                
                console.log(`   Created: ${sessionData.createdAt?.toDate?.() || sessionData.createdAt || 'Unknown'}`);
            });
        }
        
    } catch (error) {
        console.error("❌ Error checking orders:", error);
    }
}

// Run the check
checkOrders().then(() => {
    console.log("\n✅ Order check complete");
    process.exit(0);
}).catch(error => {
    console.error("❌ Error:", error);
    process.exit(1);
}); 
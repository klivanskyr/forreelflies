const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');

// Your Firebase config
const firebaseConfig = {
  // Add your Firebase config here
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkOrders() {
  try {
    console.log('🔍 Checking orders for vendor: cpR9oQYaGMaVx83K6pozBTkEUum1');
    
    // Query all orders
    const ordersQuery = query(collection(db, "orders"));
    const ordersSnapshot = await getDocs(ordersQuery);
    
    console.log(`📊 Found ${ordersSnapshot.docs.length} total orders`);
    
    // Check orders for this specific vendor
    const vendorOrdersQuery = query(
      collection(db, "orders"),
      where("vendorId", "==", "cpR9oQYaGMaVx83K6pozBTkEUum1")
    );
    const vendorOrdersSnapshot = await getDocs(vendorOrdersQuery);
    
    console.log(`🏪 Found ${vendorOrdersSnapshot.docs.length} orders for vendor cpR9oQYaGMaVx83K6pozBTkEUum1`);
    
    // Log all orders
    ordersSnapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`\n📦 Order ${index + 1}:`);
      console.log(`   ID: ${doc.id}`);
      console.log(`   Vendor ID: ${data.vendorId}`);
      console.log(`   Customer: ${data.customerName}`);
      console.log(`   Amount: $${data.amount}`);
      console.log(`   Status: ${data.payoutStatus}`);
      console.log(`   Created: ${data.purchaseDate}`);
    });
    
    // Log vendor-specific orders
    if (vendorOrdersSnapshot.docs.length > 0) {
      console.log('\n🎯 Orders for vendor cpR9oQYaGMaVx83K6pozBTkEUum1:');
      vendorOrdersSnapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`\n   Order ${index + 1}:`);
        console.log(`   ID: ${doc.id}`);
        console.log(`   Customer: ${data.customerName}`);
        console.log(`   Amount: $${data.amount}`);
        console.log(`   Status: ${data.payoutStatus}`);
        console.log(`   Products: ${data.products?.length || 0} items`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking orders:', error);
  }
}

checkOrders(); 
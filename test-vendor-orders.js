const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs } = require('firebase/firestore');

// Firebase config (you'll need to add your actual config)
const firebaseConfig = {
  // Add your Firebase config here
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testVendorOrders() {
  try {
    console.log('Testing vendor orders...');
    
    // Test with a specific vendor ID (replace with actual vendor ID)
    const vendorId = 'test-vendor-id';
    
    const ordersQuery = query(
      collection(db, "orders"),
      where("vendorId", "==", vendorId)
    );

    const ordersSnapshot = await getDocs(ordersQuery);
    const orders = ordersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log(`Found ${orders.length} orders for vendor ${vendorId}`);
    
    orders.forEach((order, index) => {
      console.log(`\nOrder ${index + 1}:`);
      console.log(`- ID: ${order.id}`);
      console.log(`- Payout Status: ${order.payoutStatus}`);
      console.log(`- Amount: $${order.amount}`);
      console.log(`- Shipping Status: ${order.shippingStatus || 'N/A'}`);
      console.log(`- Has Label URL: ${!!order.shippoLabelUrl}`);
      console.log(`- Tracking Number: ${order.trackingNumber || 'N/A'}`);
    });

  } catch (error) {
    console.error('Error testing vendor orders:', error);
  }
}

// Run the test
testVendorOrders(); 
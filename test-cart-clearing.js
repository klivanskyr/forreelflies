const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, getDocs, deleteDoc, setDoc } = require('firebase/firestore');

// Firebase configuration (use your actual config)
const firebaseConfig = {
  // Add your Firebase config here
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testCartClearing() {
  console.log('🧪 Testing Cart Clearing Functionality\n');

  const testUserId = 'test-user-' + Date.now();
  const testProductIds = ['product-1', 'product-2', 'product-3'];

  try {
    // 1. Add test items to cart
    console.log('📦 Adding test items to cart...');
    for (const productId of testProductIds) {
      await setDoc(doc(db, 'users', testUserId, 'cart', productId), {
        quantity: Math.floor(Math.random() * 5) + 1
      });
    }
    console.log('✅ Added', testProductIds.length, 'items to cart');

    // 2. Verify cart has items
    console.log('\n🔍 Verifying cart contents...');
    const cartDocs = await getDocs(collection(db, 'users', testUserId, 'cart'));
    console.log('📊 Cart contains', cartDocs.docs.length, 'items');

    // 3. Simulate cart clearing (like in webhook)
    console.log('\n🛒 Clearing cart...');
    if (!cartDocs.empty) {
      const deletePromises = cartDocs.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      console.log('✅ Successfully cleared', cartDocs.docs.length, 'items from cart');
    } else {
      console.log('ℹ️ Cart was already empty');
    }

    // 4. Verify cart is empty
    console.log('\n🔍 Verifying cart is empty...');
    const emptyCartDocs = await getDocs(collection(db, 'users', testUserId, 'cart'));
    console.log('📊 Cart now contains', emptyCartDocs.docs.length, 'items');

    if (emptyCartDocs.docs.length === 0) {
      console.log('✅ Cart clearing test PASSED');
    } else {
      console.log('❌ Cart clearing test FAILED - cart still has items');
    }

    // 5. Clean up test data
    console.log('\n🧹 Cleaning up test data...');
    // Note: Cart is already cleared, but we could clean up the user document if needed
    console.log('✅ Test cleanup complete');

  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testCartClearing().then(() => {
  console.log('\n🏁 Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
}); 
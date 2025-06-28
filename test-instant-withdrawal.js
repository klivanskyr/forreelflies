require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const admin = require('firebase-admin');
const serviceAccount = require('./forreelflies-9abdb-firebase-adminsdk-91l3l-b3625e6e42.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function testInstantWithdrawal() {
  try {
    console.log('Testing instant withdrawal...');

    // 1. Create a test vendor
    console.log('1️⃣ Creating test vendor...');
    const vendorId = 'test_vendor_' + Date.now();
    const stripeAccount = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: `test${Date.now()}@example.com`,
      capabilities: {
        transfers: {requested: true},
      },
    });
    
    await db.collection('vendors').doc(vendorId).set({
      stripeAccountId: stripeAccount.id,
      storeName: 'Test Vendor Store',
      email: `test${Date.now()}@example.com`,
    });
    console.log('✅ Test vendor created with Stripe account:', stripeAccount.id);

    // 2. Create a test payment with the special test card that creates available balance
    console.log('\n2️⃣ Creating test payment...');
    const paymentMethod = await stripe.paymentMethods.create({
      type: 'card',
      card: {
        number: '4000000000000077', // This card creates an available balance
        exp_month: 12,
        exp_year: 2025,
        cvc: '123',
      },
    });
    console.log('✅ Test payment method created');

    // 3. Create a test order that's immediately available
    console.log('\n3️⃣ Creating test order...');
    const orderId = 'test_order_' + Date.now();
    const orderAmount = 1000; // $10.00
    await db.collection('orders').doc(orderId).set({
      id: orderId,
      vendorId: vendorId,
      vendorName: 'Test Vendor Store',
      customerId: 'test_customer',
      customerEmail: 'test@example.com',
      amount: orderAmount,
      subtotal: orderAmount - 5,
      shippingCost: 5,
      currency: 'usd',
      payoutStatus: 'available',
      purchaseDate: new Date(),
      withdrawAvailableDate: new Date(),
      products: [{
        productId: 'test_product',
        productName: 'Test Product',
        quantity: 1,
        price: orderAmount
      }],
      checkoutSessionId: 'test_session_' + Date.now(),
      shippingAddress: {
        name: 'Test Customer',
        street1: '123 Test St',
        city: 'Test City',
        state: 'TS',
        zip: '12345',
        country: 'US'
      }
    });
    console.log('✅ Test order created:', orderId);

    // 4. Create a charge to add funds to the available balance
    console.log('\n4️⃣ Creating test charge...');
    const charge = await stripe.charges.create({
      amount: orderAmount,
      currency: 'usd',
      source: 'tok_bypassPending', // This creates an immediately available balance
      transfer_group: orderId,
    });
    console.log('✅ Test charge created:', charge.id);

    // 5. Test individual withdrawal
    console.log('\n5️⃣ Testing individual withdrawal...');
    const withdrawResponse = await fetch('http://localhost:3000/api/v1/vendor/withdraw-order', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vendorId: vendorId,
        orderId: orderId
      })
    });

    const withdrawResult = await withdrawResponse.json();
    console.log('Individual withdrawal response:', withdrawResult);

    if (withdrawResult.success) {
      console.log('✅ Individual withdrawal successful!');
      console.log('Transfer ID:', withdrawResult.transferId);
      console.log('Amount:', withdrawResult.amount);

      // 6. Verify order status
      const updatedOrder = await db.collection('orders').doc(orderId).get();
      const orderData = updatedOrder.data();
      
      console.log('\n6️⃣ Verifying order status...');
      console.log('Order payout status:', orderData.payoutStatus);
      console.log('Stripe transfer ID:', orderData.stripeTransferId);
      
      if (orderData.payoutStatus === 'withdrawn' && orderData.stripeTransferId) {
        console.log('✅ Order status verified successfully!');
      } else {
        console.log('❌ Order status verification failed!');
      }
    } else {
      console.log('❌ Individual withdrawal failed:', withdrawResult.error);
    }

    // 7. Test bulk withdrawal
    console.log('\n7️⃣ Testing bulk withdrawal...');
    const bulkWithdrawResponse = await fetch('http://localhost:3000/api/v1/vendor/withdraw', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        vendorId: vendorId
      })
    });

    const bulkWithdrawResult = await bulkWithdrawResponse.json();
    console.log('Bulk withdrawal response:', bulkWithdrawResult);

    if (bulkWithdrawResult.success) {
      console.log('✅ Bulk withdrawal successful!');
      console.log('Payout ID:', bulkWithdrawResult.payoutId);
      console.log('Updated Orders:', bulkWithdrawResult.updatedOrderIds);
    } else {
      console.log('❌ Bulk withdrawal failed:', bulkWithdrawResult.error);
    }

    // 8. Cleanup
    console.log('\n8️⃣ Cleaning up test data...');
    await db.collection('vendors').doc(vendorId).delete();
    await db.collection('orders').doc(orderId).delete();
    await stripe.accounts.del(stripeAccount.id);
    console.log('✅ Test data cleaned up');

    console.log('\n🎉 Test completed!');

  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testInstantWithdrawal(); 
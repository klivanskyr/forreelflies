const fetch = require('node-fetch');

async function testAdminUserCreation() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    // Step 1: Admin login
    console.log('🔐 Logging in as admin...');
    const loginResponse = await fetch(`${baseUrl}/api/v1/auth/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'admin123'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Admin login failed: ${loginResponse.status}`);
    }

    const cookies = loginResponse.headers.get('set-cookie');
    console.log('✅ Admin login successful');

    // Step 2: Create user
    console.log('👤 Creating user...');
    const userData = {
      email: `test-user-${Date.now()}@example.com`,
      password: 'testpassword123',
      fullName: 'Test User',
      vendorName: 'Test Fly Store',
      phoneNumber: '(555) 123-4567',
      description: 'A test store for fly fishing equipment',
      address: '123 Test Street',
      city: 'Test City',
      state: 'TS',
      zipCode: '12345',
      country: 'US'
    };

    const userResponse = await fetch(`${baseUrl}/api/v1/user`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        email: userData.email,
        password: userData.password
      })
    });

    if (!userResponse.ok) {
      const errorData = await userResponse.json();
      throw new Error(`User creation failed: ${errorData.error}`);
    }

    const userResult = await userResponse.json();
    console.log('✅ User created successfully:', userResult.uid);

    // Step 3: Create vendor request
    console.log('🏪 Creating vendor request...');
    const vendorRequestResponse = await fetch(`${baseUrl}/api/v1/vendor/request-vendor`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        uid: userResult.uid,
        name: userData.fullName,
        storeName: userData.vendorName,
        storeSlug: userData.vendorName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        storeEmail: userData.email,
        storePhone: userData.phoneNumber,
        storeDescription: userData.description,
        storeStreetAddress: userData.address,
        storeCity: userData.city,
        storeZip: userData.zipCode,
        storeCountry: userData.country,
        storeState: userData.state
      })
    });

    if (!vendorRequestResponse.ok) {
      const errorData = await vendorRequestResponse.json();
      throw new Error(`Vendor request creation failed: ${errorData.message}`);
    }

    console.log('✅ Vendor request created successfully');

    // Step 4: Approve vendor
    console.log('✅ Approving vendor...');
    const approveResponse = await fetch(`${baseUrl}/api/v1/vendor/approve-vendor`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookies
      },
      body: JSON.stringify({
        uid: userResult.uid
      })
    });

    if (!approveResponse.ok) {
      const errorData = await approveResponse.json();
      throw new Error(`Vendor approval failed: ${errorData.message}`);
    }

    const approveResult = await approveResponse.json();
    console.log('✅ Vendor approved successfully:', approveResult);

    console.log('\n🎉 All tests passed! User and vendor created successfully.');
    console.log(`User ID: ${userResult.uid}`);
    console.log(`Store Name: ${userData.vendorName}`);
    console.log(`Stripe Account: ${approveResult.vendor?.stripeAccountId || 'Created'}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testAdminUserCreation(); 
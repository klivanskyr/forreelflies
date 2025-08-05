const fetch = require('node-fetch');

async function testUserSearch() {
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

    // Step 2: Test user search
    console.log('🔍 Testing user search...');
    const searchResponse = await fetch(`${baseUrl}/api/v1/user/search?q=test`, {
      headers: { 
        'Cookie': cookies
      }
    });

    if (!searchResponse.ok) {
      throw new Error(`User search failed: ${searchResponse.status}`);
    }

    const searchData = await searchResponse.json();
    console.log('✅ User search successful');
    console.log(`Found ${searchData.users.length} users:`);
    searchData.users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} (${user.username || 'no username'})`);
    });

    // Step 3: Test upgrading a user to vendor (if users found)
    if (searchData.users.length > 0) {
      const testUser = searchData.users[0];
      console.log(`\n🏪 Testing upgrade of user: ${testUser.email}`);
      
      // Create vendor request
      const vendorRequestResponse = await fetch(`${baseUrl}/api/v1/vendor/request-vendor`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': cookies
        },
        body: JSON.stringify({
          uid: testUser.uid,
          name: 'Test User',
          storeName: 'Test Store',
          storeSlug: 'test-store',
          storeEmail: testUser.email,
          storePhone: '(555) 123-4567',
          storeDescription: 'A test store',
          storeStreetAddress: '123 Test St',
          storeCity: 'Test City',
          storeZip: '12345',
          storeCountry: 'US',
          storeState: 'TS'
        })
      });

      if (!vendorRequestResponse.ok) {
        const errorData = await vendorRequestResponse.json();
        throw new Error(`Vendor request creation failed: ${errorData.message}`);
      }

      console.log('✅ Vendor request created successfully');

      // Approve vendor
      const approveResponse = await fetch(`${baseUrl}/api/v1/vendor/approve-vendor`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Cookie': cookies
        },
        body: JSON.stringify({
          uid: testUser.uid
        })
      });

      if (!approveResponse.ok) {
        const errorData = await approveResponse.json();
        throw new Error(`Vendor approval failed: ${errorData.message}`);
      }

      const approveResult = await approveResponse.json();
      console.log('✅ User upgraded to vendor successfully:', approveResult);
    }

    console.log('\n🎉 All tests passed! User search and upgrade functionality works correctly.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testUserSearch(); 
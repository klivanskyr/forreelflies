const fetch = require('node-fetch');

async function testSearchAPI() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    // Step 1: Admin login
    console.log('🔐 Logging in as admin...');
    const loginResponse = await fetch(`${baseUrl}/api/v1/auth/admin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: 'admin',
        password: 'Cockelmann'
      })
    });

    if (!loginResponse.ok) {
      throw new Error(`Admin login failed: ${loginResponse.status}`);
    }

    const cookies = loginResponse.headers.get('set-cookie');
    console.log('✅ Admin login successful');

    // Step 2: Test search API
    console.log('🔍 Testing search API...');
    
    // Test with empty search to get all users
    const allUsersResponse = await fetch(`${baseUrl}/api/v1/user/search?q=`, {
      headers: { 
        'Cookie': cookies
      }
    });

    console.log('All users response status:', allUsersResponse.status);
    
    if (allUsersResponse.ok) {
      const allUsersData = await allUsersResponse.json();
      console.log('All users results:', allUsersData);
      console.log(`Found ${allUsersData.users.length} total users`);
    }

    // Test with different search terms
    const searchTerms = ['test', 'user', 'admin', 'a', 'b', 'c'];
    
    for (const term of searchTerms) {
      console.log(`\n🔍 Testing search with term: "${term}"`);
      const searchResponse = await fetch(`${baseUrl}/api/v1/user/search?q=${encodeURIComponent(term)}`, {
        headers: { 
          'Cookie': cookies
        }
      });

      console.log(`Search response status for "${term}":`, searchResponse.status);
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        console.log(`Found ${searchData.users.length} users for "${term}"`);
        if (searchData.users.length > 0) {
          console.log('Users found:', searchData.users.map(u => ({ email: u.email, username: u.username })));
        }
      } else {
        const errorText = await searchResponse.text();
        console.error(`Search failed for "${term}":`, errorText);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testSearchAPI(); 
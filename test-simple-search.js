const fetch = require('node-fetch');

async function testSimpleSearch() {
  const baseUrl = 'http://localhost:3000';
  
  try {
    console.log('🔐 Testing admin login...');
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

    console.log('🔍 Testing search API...');
    const searchResponse = await fetch(`${baseUrl}/api/v1/user/search?q=`, {
      headers: { 'Cookie': cookies }
    });

    console.log('Search response status:', searchResponse.status);
    
    if (searchResponse.ok) {
      const data = await searchResponse.json();
      console.log('✅ Search API working');
      console.log(`Found ${data.users.length} users`);
      if (data.users.length > 0) {
        console.log('Sample users:', data.users.slice(0, 3).map(u => u.email));
      }
    } else {
      const errorText = await searchResponse.text();
      console.error('❌ Search failed:', errorText);
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testSimpleSearch(); 
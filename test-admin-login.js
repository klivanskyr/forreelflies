const fetch = require('node-fetch');

async function testAdminLogin() {
  const url = 'http://localhost:3000/api/v1/auth/admin';
  const credentials = {
    username: 'admin',
    password: 'Cockelmann'
  };

  console.log('Testing admin login with credentials:', {
    username: credentials.username,
    password: '***'
  });

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials)
    });

    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Response body:', responseText);

    if (response.ok) {
      console.log('✅ Admin login successful!');
    } else {
      console.log('❌ Admin login failed');
    }
  } catch (error) {
    console.error('Error testing admin login:', error);
  }
}

testAdminLogin(); 
const jwt = require('jsonwebtoken');

const NEXTAUTH_SECRET = "fR8xK9mP2nQ7vW3zH6jL4sA5dF1gY0eR8tU9iO3pX2cV7bN1mQ6wE4rT5yH8kJ2s";
const ADMIN_JWT_SECRET = NEXTAUTH_SECRET + "_admin";

console.log('NEXTAUTH_SECRET:', NEXTAUTH_SECRET);
console.log('ADMIN_JWT_SECRET:', ADMIN_JWT_SECRET);

// Test creating a JWT token
const testPayload = {
  username: "admin",
  password: "Cockelmann",
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 1 day
};

try {
  const token = jwt.sign(testPayload, ADMIN_JWT_SECRET);
  console.log('Generated JWT token:', token);
  
  // Test verifying the token
  const decoded = jwt.verify(token, ADMIN_JWT_SECRET);
  console.log('Decoded token:', decoded);
  
  // Test credentials check
  if (decoded.username === "admin" && decoded.password === "Cockelmann") {
    console.log('✅ Credentials match!');
  } else {
    console.log('❌ Credentials do not match');
    console.log('Expected: admin/Cockelmann');
    console.log('Got:', decoded.username + '/' + decoded.password);
  }
} catch (error) {
  console.error('Error:', error);
} 
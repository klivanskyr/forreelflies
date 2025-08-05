# Firebase Project Setup Guide

## Current Issue
Your development project (`forreelflies-441004`) doesn't have Firebase Storage enabled, but your production project (`forreelflies-9abdb`) does.

## Solution: Enable Storage in Development Project

### Step 1: Go to Firebase Console
1. Visit [Firebase Console](https://console.firebase.google.com/)
2. Select your **development project**: `forreelflies-441004`

### Step 2: Enable Firebase Storage
1. In the left sidebar, click on **"Storage"**
2. If you see "Get Started", click it
3. Choose a location for your storage bucket (recommend: `us-central1` or `us-east1`)
4. Start in **test mode** (allow all reads/writes for now)

### Step 3: Set Storage Rules
After enabling Storage, set up basic rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload files
    match /products/{vendorId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    
    // Allow test uploads
    match /test-connection.txt {
      allow read, write: if true;
    }
  }
}
```

### Step 4: Test the Setup
Run the test script to verify it works:
```bash
node test-image-upload.js
```

## Alternative: Switch to Production Project

If you prefer to use your production project for development:

### Step 1: Update Environment Variables
Uncomment the production configuration in `.env.local`:

```env
# PRODUCTION (Uncomment these lines)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyC-3OtMwPi1yjPvyE0qCvNYkrqdnRhmc58
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=forreelflies-9abdb.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=forreelflies-9abdb
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=forreelflies-9abdb.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1087727029139
NEXT_PUBLIC_FIREBASE_APP_ID=1:1087727029139:web:e124cfd7fb4837f9033666
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-BWCDVFCC5Q

# Comment out the development configuration
# NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyBJJ-c8Nz4jPY81CfkKf5ewAcoPfxkQoXA
# ... (comment out all development config)
```

### Step 2: Update Admin Configuration
Also update the admin configuration:

```env
FIREBASE_ADMIN_PROJECT_ID=forreelflies-9abdb
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-91l3l@forreelflies-9abdb.iam.gserviceaccount.com
# ... (update other admin config)
```

## Recommendation

I recommend **Option 1** (enabling Storage in development project) because:
- Keeps development and production separate
- Prevents accidental data mixing
- Allows testing without affecting production data

## Quick Fix for Now

The fallback system I implemented will work immediately - images will be stored as base64 strings. This is a temporary solution while you set up Firebase Storage properly.

## Next Steps

1. **Immediate**: Try uploading an image - it should work with the base64 fallback
2. **Short-term**: Enable Firebase Storage in your development project
3. **Long-term**: Consider using a dedicated storage service like AWS S3 or Cloudinary 
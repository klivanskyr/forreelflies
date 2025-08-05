import { initializeApp } from 'firebase/app';
import { getFirestore } from "firebase/firestore";
import { getAuth } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Validate Firebase configuration
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
    measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Check for missing configuration
const missingConfig = Object.entries(firebaseConfig)
    .filter(([key, value]) => !value && key !== 'measurementId')
    .map(([key]) => key);

if (missingConfig.length > 0) {
    console.error('Missing Firebase configuration:', missingConfig);
    throw new Error(`Missing Firebase configuration: ${missingConfig.join(', ')}`);
}

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);



export async function uploadFileAndGetUrl(file: File, path: string, retries = 3): Promise<string> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`[Upload Attempt ${attempt}/${retries}] Starting upload:`, {
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        fileName: file.name,
        fileType: file.type,
        path: path,
        attempt: attempt
      });

      // Validate file before upload
      if (!file || file.size === 0) {
        throw new Error('File is empty or invalid');
      }

      if (file.size > 50 * 1024 * 1024) { // 50MB limit
        throw new Error('File size exceeds 50MB limit');
      }

      const storage = getStorage();
      const storageRef = ref(storage, path);
      
      // Add timeout protection with exponential backoff
      const timeout = Math.min(30000 * Math.pow(2, attempt - 1), 120000); // Max 2 minutes
      const uploadPromise = uploadBytes(storageRef, file);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error(`Upload timeout after ${timeout/1000} seconds`)), timeout)
      );
      
      console.log(`[Upload Attempt ${attempt}] Uploading file to Firebase Storage...`);
      await Promise.race([uploadPromise, timeoutPromise]);
      console.log(`[Upload Attempt ${attempt}] File uploaded successfully, getting download URL...`);
      
      const downloadURL = await getDownloadURL(storageRef);
      console.log(`[Upload Attempt ${attempt}] Download URL obtained:`, downloadURL);
      return downloadURL;
    } catch (error) {
      console.error(`[Upload Attempt ${attempt}] Upload failed:`, error);
      
      // Handle specific Firebase Storage errors
      if (error instanceof Error) {
        if (error.message.includes('storage/unknown') || error.message.includes('404')) {
          throw new Error('Firebase Storage bucket not found or inaccessible. Please check your Firebase project configuration.');
        }
        if (error.message.includes('unauthorized') || error.message.includes('permission')) {
          throw new Error('Upload failed: Insufficient permissions. Please check your authentication.');
        }
        if (error.message.includes('quota') || error.message.includes('storage/quota')) {
          throw new Error('Upload failed: Storage quota exceeded. Please contact support.');
        }
        if (error.message.includes('invalid-argument') || error.message.includes('storage/invalid-argument')) {
          throw new Error('Upload failed: Invalid file or path. Please try a different file.');
        }
        if (error.message.includes('storage/object-not-found')) {
          throw new Error('Upload failed: Storage object not found. Please try again.');
        }
        if (error.message.includes('storage/bucket-not-found')) {
          throw new Error('Upload failed: Storage bucket not found. Please check your Firebase configuration.');
        }
      }
      
      // If this was the last attempt, throw the error
      if (attempt === retries) {
        if (error instanceof Error) {
          throw new Error(`Failed to upload file after ${retries} attempts: ${error.message}`);
        }
        throw new Error(`Failed to upload file after ${retries} attempts: Unknown error`);
      }
      
      // Wait before retry with exponential backoff
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Max 10 seconds
      console.log(`[Upload Attempt ${attempt}] Retrying in ${delay/1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error(`Failed to upload file after ${retries} attempts`);
}

// Helper function to test Firebase Storage connectivity
export async function testFirebaseStorageConnection(): Promise<boolean> {
  try {
    console.log('Testing Firebase Storage connectivity...');
    console.log('Storage bucket:', process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
    console.log('Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
    
    const testRef = ref(getStorage(), 'test-connection.txt');
    const testBlob = new Blob(['test'], { type: 'text/plain' });
    await uploadBytes(testRef, testBlob);
    console.log('Firebase Storage connection test successful');
    return true;
  } catch (error) {
    console.error('Firebase Storage connection test failed:', error);
    
    // Provide specific error messages for common issues
    if (error instanceof Error) {
      if (error.message.includes('storage/unknown') || error.message.includes('404')) {
        console.error('❌ Storage bucket not found or inaccessible');
        console.error('💡 Please check:');
        console.error('   - Firebase project is active');
        console.error('   - Storage bucket exists: ' + process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
        console.error('   - Storage rules allow uploads');
        console.error('   - API key has proper permissions');
      }
    }
    
    return false;
  }
}

export { app, auth, db, storage };

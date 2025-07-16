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

export async function uploadFileAndGetUrl(file: File, path: string): Promise<string> {
  try {
    console.log('Starting upload with config:', {
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      fileName: file.name,
      path: path
    });

    const storage = getStorage();
    const storageRef = ref(storage, path);
    
    // Add timeout protection
    const uploadPromise = uploadBytes(storageRef, file);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Upload timeout after 30 seconds')), 30000)
    );
    
    console.log('Uploading file to Firebase Storage...');
    await Promise.race([uploadPromise, timeoutPromise]);
    console.log('File uploaded successfully, getting download URL...');
    
    const downloadURL = await getDownloadURL(storageRef);
    console.log('Download URL obtained:', downloadURL);
    return downloadURL;
  } catch (error) {
    console.error('Upload failed:', error);
    if (error instanceof Error) {
      throw new Error(`Failed to upload file: ${error.message}`);
    }
    throw new Error('Failed to upload file: Unknown error');
  }
}

export { app, auth, db, storage };

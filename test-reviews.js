const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, doc, updateDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

const firebaseConfig = {
  apiKey: "AIzaSyAJp1xNi6xDTlMJSQs3Jf1YBBqfLQxqzVQ",
  authDomain: "forreelflies-9abdb.firebaseapp.com",
  projectId: "forreelflies-9abdb",
  storageBucket: "forreelflies-9abdb.firebasestorage.app",
  messagingSenderId: "962712542142",
  appId: "1:962712542142:web:9b7e0b8b8b8b8b8b8b8b8b",
  measurementId: "G-XXXXXXXXXX"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Sample product reviews
const productReviews = [
  {
    productId: "existing-product-id", // Replace with actual product ID
    productName: "Adams Dry Fly",
    userId: "test-user-1",
    userName: "Mike Anderson",
    userEmail: "mike@example.com",
    rating: 5,
    title: "Excellent quality flies!",
    comment: "These dry flies are absolutely perfect. The craftsmanship is outstanding and they've been incredibly effective on the water. Caught several trout with these beauties!",
    verified: true,
    helpful: 3,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    productId: "existing-product-id",
    productName: "Adams Dry Fly",
    userId: "test-user-2",
    userName: "Sarah Johnson",
    userEmail: "sarah@example.com",
    rating: 4,
    title: "Great flies, fast shipping",
    comment: "Really nice quality flies. The tying is neat and they look very realistic. Only minor complaint is the hook could be a bit sharper, but overall very satisfied.",
    verified: true,
    helpful: 2,
    createdAt: new Date(Date.now() - 86400000), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000)
  },
  {
    productId: "existing-product-id",
    productName: "Adams Dry Fly",
    userId: "test-user-3",
    userName: "Tom Wilson",
    userEmail: "tom@example.com",
    rating: 5,
    title: "Perfect for mountain streams",
    comment: "Used these on my last trip to Colorado. They worked amazingly well in the mountain streams. The fish couldn't resist them!",
    verified: true,
    helpful: 1,
    createdAt: new Date(Date.now() - 172800000), // 2 days ago
    updatedAt: new Date(Date.now() - 172800000)
  }
];

// Sample vendor reviews
const vendorReviews = [
  {
    vendorId: "BMEbcYjh6sc5vYjWov8PNrSwLfH2", // Replace with actual vendor ID
    vendorName: "Mountain Fly Co",
    userId: "test-user-1",
    userName: "Mike Anderson",
    userEmail: "mike@example.com",
    rating: 5,
    title: "Outstanding service and quality",
    comment: "This vendor consistently delivers high-quality flies with excellent customer service. Fast shipping and great communication throughout the process.",
    verified: true,
    helpful: 5,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    vendorId: "BMEbcYjh6sc5vYjWov8PNrSwLfH2",
    vendorName: "Mountain Fly Co",
    userId: "test-user-4",
    userName: "Lisa Chen",
    userEmail: "lisa@example.com",
    rating: 4,
    title: "Great selection and quality",
    comment: "Wide variety of flies and all are well-tied. Prices are reasonable and the vendor is very responsive to questions.",
    verified: true,
    helpful: 3,
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(Date.now() - 86400000)
  },
  {
    vendorId: "BMEbcYjh6sc5vYjWov8PNrSwLfH2",
    vendorName: "Mountain Fly Co",
    userId: "test-user-5",
    userName: "David Rodriguez",
    userEmail: "david@example.com",
    rating: 5,
    title: "Highly recommend!",
    comment: "Been ordering from this vendor for months. Consistent quality and they really know their flies. Custom orders are handled perfectly.",
    verified: true,
    helpful: 4,
    createdAt: new Date(Date.now() - 259200000), // 3 days ago
    updatedAt: new Date(Date.now() - 259200000)
  }
];

async function addSampleReviews() {
  try {
    console.log('Adding sample product reviews...');
    
    // Add product reviews
    for (const review of productReviews) {
      const docRef = await addDoc(collection(db, 'productReviews'), review);
      console.log('Added product review with ID:', docRef.id);
    }

    console.log('Adding sample vendor reviews...');
    
    // Add vendor reviews
    for (const review of vendorReviews) {
      const docRef = await addDoc(collection(db, 'vendorReviews'), review);
      console.log('Added vendor review with ID:', docRef.id);
    }

    // Update product with review summary
    const productReviewSummary = {
      averageRating: 4.7, // (5 + 4 + 5) / 3
      totalReviews: 3,
      ratingDistribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 1,
        5: 2
      }
    };

    // Update vendor with review summary
    const vendorReviewSummary = {
      averageRating: 4.7, // (5 + 4 + 5) / 3
      totalReviews: 3,
      ratingDistribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 1,
        5: 2
      }
    };

    console.log('Sample reviews added successfully!');
    console.log('Note: Update the productId and vendorId in the script with actual IDs from your database');
    
  } catch (error) {
    console.error('Error adding sample reviews:', error);
  }
}

addSampleReviews(); 
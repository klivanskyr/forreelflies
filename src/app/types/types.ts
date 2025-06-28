export type StockStatus = "inStock" | "outOfStock" | "unknown";

export type Product = {
    id: string,
    name: string, 
    shortDescription?: string,
    longDescription?: string,
    tags?: string[],
    catagories?: string[],
    price: number,
    originalPrice?: number, // Original price before discount (if any)
    discountPercentage?: number, // Percentage discount (0-100)
    quantityOptions: number[],
    stockStatus?: StockStatus,
    stockQuantity?: number, // Actual inventory count
    lowStockThreshold?: number, // Alert when stock is low
    trackQuantity?: boolean, // Whether to track inventory
    vendorId: string,
    vendorName: string,
    shippingWeight: number,
    shippingLength: number,
    shippingWidth: number,
    shippingHeight: number,
    processingTime?: number,
    upsells?: Product[],
    crossSells?: Product[],
    isDraft?: boolean,
    images?: string[],
    
    // Ratings & Reviews
    averageRating?: number,
    reviewCount?: number,
    
    // Timestamps
    createdAt?: Date,
    updatedAt?: Date,
    
    // Additional metadata
    customFields?: { [key: string]: string }, // For flexible additional data
    reviewSummary?: ReviewSummary,
}

export type Vendor = {
    id: string,
    ownerName: string,
    ownerId: string,
    products: Product[],
    storeCity: string,
    storeCountry: string,
    storeDescription: string,
    storeEmail: string,
    storeName: string,
    storePhone: string,
    storeSlug?: string,
    storeState: string,
    storeStreetAddress: string,
    storeZip: string,
}

export type Sort = "latest" | "oldest" | "priceLowToHigh" | "priceHighToLow";
export type PageSize = 12 | 24 | 48 | -1;
export type Layout = "column" | "grid2" | "grid3" | "grid4" | "list";

export type Rate = {
    products: Product[],
    sellerId: string,
    sellerName: string,
    objectId: string,
    amount: number,
    currency: string,
    provider: string,
    estimatedDays: number,
}

export type VendorSignUpStatus = 
    | "notStarted" 
    | "submittedApprovalForm" 
    | "approvalFormApproved" 
    | "approvalFormRejected" 
    | "onboardingStarted" 
    | "onboardingCompleted"
    | "stripeSetupPending";

export type OrderProduct = {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number; // per unit
};

export type FirestoreTimestamp = {
  seconds: number;
  nanoseconds: number;
};

export type Order = {
  id?: string;  // Optional because it's added after creation
  vendorId: string;
  vendorName: string;
  customerId: string;
  customerEmail: string;
  amount: number;
  subtotal: number;
  shippingCost: number;
  currency: string;
  payoutStatus: 'pending' | 'available' | 'withdrawn';  // Simplified payout statuses
  purchaseDate: Date | FirestoreTimestamp;
  withdrawAvailableDate: Date | FirestoreTimestamp;
  estimatedDeliveryDate?: Date | FirestoreTimestamp;
  deliveredDate?: Date | FirestoreTimestamp;  // Added to track actual delivery date
  lastTrackingUpdate?: Date | FirestoreTimestamp;
  products: Array<{
    productId: string;
    productName: string;
    productImage?: string;
    quantity: number;
    price: number;
  }>;
  stripeTransferId?: string;
  shippoLabelUrl?: string;
  trackingNumber?: string;
  shippingStatus?: 'pending' | 'label_created' | 'shipped' | 'delivered' | 'delivery_failed' | 'tracking_lost' | 'label_failed';
  refundStatus?: 'none' | 'requested' | 'completed';
  checkoutSessionId: string;  // Reference to the original checkout session
  shippingAddress: {
    name: string;
    street1: string;
    street2?: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone?: string;
  };
};

export type VendorProfile = {
  id: string;
  storeName: string;
  bannerImageUrl?: string;
  profileImageUrl?: string;
  bio?: string;
  socialLinks?: { type: string; url: string }[];
  // Add any other fields you want to display
  reviewSummary?: ReviewSummary,
};

export type ProductGalleryProps = {
  images: string[];
};

export type ProductWithVendor = {
  id: string;
  name: string;
  price: number;
  images: string[];
  vendorId: string;
  vendorName: string;
  // Add other product fields as needed
};

export type AdminImageAssignment = {
  section: string; // e.g., 'slider', 'about-us', etc.
  imageUrl: string;
  label?: string;
};

export type Review = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  rating: number; // 1-5
  title: string;
  comment: string;
  createdAt: Date;
  updatedAt: Date;
  verified: boolean; // true if user purchased the product/used the vendor
  helpful: number; // number of users who found this review helpful
  images?: string[]; // optional review images
};

export type ProductReview = Review & {
  productId: string;
  productName: string;
};

export type VendorReview = Review & {
  vendorId: string;
  vendorName: string;
};

export type ReviewSummary = {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
};

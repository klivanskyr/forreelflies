export type StockStatus = "inStock" | "outOfStock" | "unknown";

export type Product = {
    id: string,
    name: string, 
    shortDescription?: string,
    longDescription?: string,
    tags?: string[],
    catagories?: string[],
    price: number,
    quantityOptions: number[],
    stockStatus?: StockStatus,
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
export type PageSize = 5 | 10 | 20 | 50 | 100 | -1;
export type Layout = "column" | "grid2" | "grid3" | "grid4";

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

export type VendorSignUpStatus = "notStarted" | "submittedApprovalForm" | "approvalFormApproved" | "approvalFormRejected" | "onboardingStarted" | "onboardingCompleted";

export type OrderProduct = {
  productId: string;
  productName: string;
  productImage?: string;
  quantity: number;
  price: number; // per unit
};

export type Order = {
  id: string; // Firestore doc ID
  vendorId: string;
  vendorName: string;
  products: OrderProduct[];
  amount: number;
  currency: string;
  purchaseDate: Date;
  customerId: string;
  customerEmail: string;
  payoutStatus: 'pending' | 'available' | 'withdrawn';
  withdrawAvailableDate: Date;
  stripeTransferId?: string;
  shippoLabelUrl?: string;
  shippingStatus?: 'pending' | 'shipped' | 'delivered';
  refundStatus?: 'none' | 'requested' | 'completed';
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  };
  trackingNumber?: string;
};

export type VendorProfile = {
  id: string;
  storeName: string;
  bannerImageUrl?: string;
  profileImageUrl?: string;
  bio?: string;
  socialLinks?: { type: string; url: string }[];
  // Add any other fields you want to display
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

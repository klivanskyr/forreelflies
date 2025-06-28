import { db, storage } from "@/lib/firebase";
import {
    collection,
    getDocs,
    orderBy,
    query,
    where,
    doc,
    OrderByDirection,
    QueryConstraint,
    limit,
    getDoc,
    addDoc,
    setDoc,
    getDocs as getOrderDocs,
    collection as orderCollection,
    updateDoc,
    deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/app/api/utils/withRole";

type T = {
    name: string;
    price: number;
    originalPrice?: number;
    discountPercentage?: number;
    vendorId: string;
    vendorName: string;
    quantityOptions: number[];
    isDraft: boolean;
    stockQuantity?: number;
    lowStockThreshold?: number;
    trackQuantity?: boolean;
    shippingWeight: number;
    shippingLength: number;
    shippingWidth: number;
    shippingHeight: number;
    images: string[];
    createdAt: Date;
    updatedAt?: Date;
    shortDescription?: string;
    longDescription?: string;
    tags?: string[];
    categories?: string[];
    stockStatus?: string;
    processingTime?: string;
    upsells?: string[];
    crossSells?: string[];
    
    // Ratings & Reviews
    averageRating?: number;
    reviewCount?: number;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    const { pathname } = new URL(request.url);
    if (pathname.endsWith("/top-selling")) {
        // Aggregate top-selling products from orders
        try {
            const orderDocs = await getOrderDocs(orderCollection(db, "orders"));
            const salesMap: Record<string, number> = {};
            orderDocs.forEach((doc) => {
                const order = doc.data();
                if (order.products) {
                    order.products.forEach((p: unknown) => {
                        const product = p as { productId: string; quantity: number };
                        salesMap[product.productId] = (salesMap[product.productId] || 0) + (product.quantity || 0);
                    });
                }
            });
            // Sort productIds by quantity sold
            const topProductIds = Object.entries(salesMap)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([productId]) => productId);
            let products: unknown[] = [];
            if (topProductIds.length > 0) {
                // Fetch product details for top sellers
                for (const productId of topProductIds) {
                    const productDoc = await getDoc(doc(db, "products", productId));
                    if (productDoc.exists()) {
                        const productData = productDoc.data();
                        // Only include published products
                        if (!productData.isDraft) {
                            products.push({ id: productDoc.id, ...productData });
                        }
                    }
                }
            } else {
                // No sales yet, fallback to first 5 published products
                const productsRef = collection(db, "products");
                const snapshot = await getDocs(query(productsRef, where("isDraft", "==", false), limit(5)));
                products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            }
            return NextResponse.json({ data: products });
        } catch (err) {
            console.error("Failed to fetch top selling products", err);
            return NextResponse.json({ error: "Failed to fetch top selling products" }, { status: 500 });
        }
    }
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get("id");
        const vendorId = searchParams.get("vendorId");
        const sort = searchParams.get("sort");
        const search = searchParams.get("search");
        const category = searchParams.get("category");
        const tag = searchParams.get("tag");

        const tempPage = searchParams.get("page");
        const tempPageSize = searchParams.get("pageSize");

        // Parse the page and pageSize query parameters
        const page = tempPage ? parseInt(tempPage) : null;
        const pageSize = tempPageSize ? parseInt(tempPageSize) : null;

        // Sanity checks
        if (id && (vendorId || sort || page || pageSize || search || category || tag)) {
            return NextResponse.json(
                { error: "The 'id' query parameter cannot be used with other query parameters" },
                { status: 400 }
            );
        }

        // Handle single product fetch by ID
        if (id) {
            const docSnap = await getDoc(doc(db, "products", id));
            if (docSnap.exists()) {
                const productData = { id: docSnap.id, ...docSnap.data() };
                
                // Calculate review summary for the product
                try {
                    const reviewsRef = collection(db, "productReviews");
                    const reviewsQuery = query(reviewsRef, where("productId", "==", id));
                    const reviewsSnapshot = await getDocs(reviewsQuery);
                    
                    if (reviewsSnapshot.empty) {
                        (productData as any).reviewSummary = {
                            averageRating: 0,
                            totalReviews: 0,
                            ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
                        };
                    } else {
                        const reviews = reviewsSnapshot.docs.map(doc => doc.data());
                        const totalReviews = reviews.length;
                        const ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
                        
                        let totalRating = 0;
                        reviews.forEach((review: any) => {
                            totalRating += review.rating;
                            ratingDistribution[review.rating as keyof typeof ratingDistribution]++;
                        });
                        
                        const averageRating = totalRating / totalReviews;
                        
                        (productData as any).reviewSummary = {
                            averageRating,
                            totalReviews,
                            ratingDistribution
                        };
                    }
                } catch (error) {
                    console.error('Error calculating review summary:', error);
                    (productData as any).reviewSummary = {
                        averageRating: 0,
                        totalReviews: 0,
                        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
                    };
                }
                
                return NextResponse.json(productData);
            } else {
                return NextResponse.json({ error: "Product not found" }, { status: 404 });
            }
        }

        // Define sorting logic
        let orderField: string = "createdAt";
        let orderDirection: OrderByDirection = "desc";

        switch (sort) {
            case "latest":
                orderField = "createdAt";
                orderDirection = "desc";
                break;
            case "oldest":
                orderField = "createdAt";
                orderDirection = "asc";
                break;
            case "priceLowToHigh":
                orderField = "price";
                orderDirection = "asc";
                break;
            case "priceHighToLow":
                orderField = "price";
                orderDirection = "desc";
                break;
            default:
                if (sort) {
                    return NextResponse.json(
                        { error: "Invalid sort value. Allowed values: latest, oldest, priceLowToHigh, priceHighToLow" },
                        { status: 400 }
                    );
                }
        }

        const productsRef = collection(db, "products");
        const constraints: QueryConstraint[] = [orderBy(orderField, orderDirection)];

        // Add vendor filter if specified
        if (vendorId) {
            constraints.push(where("vendorId", "==", vendorId));
        }

        // Add category filter if specified
        if (category) {
            constraints.push(where("catagories", "array-contains", category));
        }

        // Add tag filter if specified
        if (tag) {
            constraints.push(where("tags", "array-contains", tag));
        }

        const baseQuery = query(productsRef, ...constraints);

        // Get all documents for search filtering and counting
        const allDocsSnapshot = await getDocs(baseQuery);
        let allProducts = allDocsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Filter out draft products (only for shop, not for vendor-specific queries)
        if (!vendorId) {
            allProducts = allProducts.filter((product: unknown) => {
                const p = product as { isDraft?: boolean };
                return !p.isDraft; // Only exclude if explicitly marked as draft
            });
        }

        // Apply search filter (client-side since Firestore doesn't support full-text search)
        if (search) {
            const searchLower = search.toLowerCase();
            allProducts = allProducts.filter((product: unknown) => {
                const p = product as {
                    name?: string;
                    shortDescription?: string;
                    longDescription?: string;
                    vendorName?: string;
                    tags?: string[];
                    catagories?: string[];
                };
                return (
                    p.name?.toLowerCase().includes(searchLower) ||
                    p.shortDescription?.toLowerCase().includes(searchLower) ||
                    p.longDescription?.toLowerCase().includes(searchLower) ||
                    p.vendorName?.toLowerCase().includes(searchLower) ||
                    (p.tags && p.tags.some((tag: string) => tag.toLowerCase().includes(searchLower))) ||
                    (p.catagories && p.catagories.some((cat: string) => cat.toLowerCase().includes(searchLower)))
                );
            });
        }

        const totalItems = allProducts.length;

        // Apply pagination
        let paginatedProducts = allProducts;
        if (page && pageSize) {
            const startIndex = (page - 1) * pageSize;
            const endIndex = startIndex + pageSize;
            paginatedProducts = allProducts.slice(startIndex, endIndex);
        } else if (pageSize && pageSize !== -1) {
            paginatedProducts = allProducts.slice(0, pageSize);
        }

        const totalPages = pageSize && pageSize !== -1 ? Math.ceil(totalItems / pageSize) : 1;

        const metadata = {
            page: page || 1,
            pageSize: pageSize || totalItems,
            totalItems,
            totalPages,
        };
        
        return NextResponse.json({
            data: paginatedProducts,
            meta: metadata
        });
    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        } else {
            return NextResponse.json({ error: `An error occurred: ${error}` }, { status: 400 });
        }
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    const user = await requireRole(request, "vendor");
    if (user instanceof NextResponse) return user;
    try {
        const formData = await request.formData(); // Handle multipart/form-data
        const name = formData.get("name")?.toString();
        const vendorId = formData.get("vendorId")?.toString();
        const isDraft = formData.get("isDraft") === "true"; // Boolean field
        const files = formData.getAll("images") as File[]; // Get all images
        const preUploadedImageUrls = formData.get("imageUrls") ? JSON.parse(formData.get("imageUrls")?.toString() || "[]") : [];
        const quantityOptions = JSON.parse(formData.get("quantityOptions")?.toString() || "[]");
        const priceField = formData.get("price")?.toString();
        const shippingWeightField = formData.get("shippingWeight")?.toString();
        const shippingLengthField = formData.get("shippingLength")?.toString();
        const shippingWidthField = formData.get("shippingWidth")?.toString();
        const shippingHeightField = formData.get("shippingHeight")?.toString();

        // Validate and parse price and shipping dimensions
        const price = priceField ? parseFloat(priceField) : NaN;
        const shippingWeight = shippingWeightField ? parseFloat(shippingWeightField) : NaN;
        const shippingLength = shippingLengthField ? parseFloat(shippingLengthField) : NaN;
        const shippingWidth = shippingWidthField ? parseFloat(shippingWidthField) : NaN;
        const shippingHeight = shippingHeightField ? parseFloat(shippingHeightField) : NaN;

        // Validate required fields
        if (!name || isNaN(price) || !vendorId || isDraft === undefined || !quantityOptions ) {
            return NextResponse.json(
                { error: "Required Fields: { name, price, vendorId, isDraft, quantityOptions (List<Number>) }" },
                { status: 400 }
            );
        }

        // Check if we have either files or pre-uploaded URLs
        if (files.length === 0 && preUploadedImageUrls.length === 0) {
            return NextResponse.json(
                { error: "At least one image is required." },
                { status: 400 }
            );
        }

        // validate shipping params "shippingWeight","shippingLength","shippingWidth","shippingHeight",
        if (isNaN(shippingLength) || isNaN(shippingHeight) || isNaN(shippingWidth) || isNaN(shippingWeight)) {
            return NextResponse.json(
                { error: "Invalid shipping fields" },
                { status: 400 }
            );
        }

        let finalImageUrls: string[] = [];

        // If we have pre-uploaded URLs, use those
        if (preUploadedImageUrls.length > 0) {
            finalImageUrls = preUploadedImageUrls;
        } else {
            // Otherwise, upload the files
            for (const file of files) {
                const storageRef = ref(storage, `products/${vendorId}/${Date.now()}-${file.name}`);
                const uploadResult = await uploadBytes(storageRef, Buffer.from(await file.arrayBuffer()));
                const downloadUrl = await getDownloadURL(uploadResult.ref); // Get the download URL
                finalImageUrls.push(downloadUrl);
            }
        }

        // get vendor name
        const vendorDoc = await getDoc(doc(db, "vendors", vendorId));
        if (!vendorDoc.exists()) {
            return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
        }

        const vendorName = vendorDoc.data()?.storeName || "Unknown Vendor: " + vendorId;

        console.log("Quantity Options:", quantityOptions);
        // validate all fields before saving
        if (quantityOptions.length === 0) {
            return NextResponse.json(
                { error: "No Quantity Options provided" },
                { status: 400 }
            );
        }

        if (name === "" || price <= 0) {
            return NextResponse.json(
                { error: "Invalid name or price" },
                { status: 400 }
            );
        }

        // Prepare product data
        const productData: T = {
            name,
            price,
            vendorId,
            vendorName,
            quantityOptions,
            isDraft,
            shippingWeight,
            shippingLength,
            shippingWidth,
            shippingHeight,
            images: finalImageUrls, // Store Firebase Storage URLs
            createdAt: new Date(),
        };

        // Conditionally add optional fields
        const optionalFields = [
            "shortDescription",
            "longDescription",
            "tags",
            "categories",
            "stockStatus",
            "processingTime",
            "upsells",
            "crossSells",
            "originalPrice",
            "discountPercentage",
            "stockQuantity",
            "lowStockThreshold",
            "trackQuantity",
        ];
        
        // Process optional fields
        for (const field of optionalFields) {
            const value = formData.get(field)?.toString();
            if (value) {
                // Array fields
                if (field === "tags" || field === "categories" || field === "upsells" || field === "crossSells") {
                    (productData as any)[field] = JSON.parse(value);
                }
                // Number fields
                else if (field === "originalPrice" || field === "discountPercentage" || field === "stockQuantity" || field === "lowStockThreshold") {
                    const numValue = parseFloat(value);
                    if (!isNaN(numValue)) {
                        (productData as any)[field] = numValue;
                    }
                }
                // Boolean fields
                else if (field === "trackQuantity") {
                    (productData as any)[field] = value === "true";
                }
                // String fields
                else {
                    (productData as any)[field] = value;
                }
            }
        }

        // Save product to Firestore
        const docRef = await addDoc(collection(db, "products"), productData);

        // Link product to vendor's products
        await setDoc(
            doc(db, "vendors", vendorId),
            {
                products: {
                    [docRef.id]: true,
                },
            },
            { merge: true }
        );

        return NextResponse.json({ data: { id: docRef.id, ...productData } }, { status: 201 });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "An unknown error occurred." },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
    const user = await requireRole(request, "vendor");
    if (user instanceof NextResponse) return user;
    
    try {
        const formData = await request.formData();
        const productId = formData.get("productId")?.toString();
        const name = formData.get("name")?.toString();
        const vendorId = formData.get("vendorId")?.toString();
        const isDraft = formData.get("isDraft") === "true";
        const files = formData.getAll("images") as File[];
        const existingImages = JSON.parse(formData.get("existingImages")?.toString() || "[]");
        const quantityOptions = JSON.parse(formData.get("quantityOptions")?.toString() || "[]");
        const priceField = formData.get("price")?.toString();
        const shippingWeightField = formData.get("shippingWeight")?.toString();
        const shippingLengthField = formData.get("shippingLength")?.toString();
        const shippingWidthField = formData.get("shippingWidth")?.toString();
        const shippingHeightField = formData.get("shippingHeight")?.toString();

        // Validate required fields
        if (!productId) {
            return NextResponse.json(
                { error: "Product ID is required for updates" },
                { status: 400 }
            );
        }

        // Check if product exists and user owns it
        const productDoc = await getDoc(doc(db, "products", productId));
        if (!productDoc.exists()) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        const productData = productDoc.data();
        if (productData.vendorId !== vendorId) {
            return NextResponse.json({ error: "Unauthorized to edit this product" }, { status: 403 });
        }

        // Parse numeric fields
        const price = priceField ? parseFloat(priceField) : productData.price;
        const shippingWeight = shippingWeightField ? parseFloat(shippingWeightField) : productData.shippingWeight;
        const shippingLength = shippingLengthField ? parseFloat(shippingLengthField) : productData.shippingLength;
        const shippingWidth = shippingWidthField ? parseFloat(shippingWidthField) : productData.shippingWidth;
        const shippingHeight = shippingHeightField ? parseFloat(shippingHeightField) : productData.shippingHeight;

        // Validate required fields
        if (!name || isNaN(price) || !vendorId || isDraft === undefined || !quantityOptions) {
            return NextResponse.json(
                { error: "Required Fields: { name, price, vendorId, isDraft, quantityOptions }" },
                { status: 400 }
            );
        }

        // Validate shipping params
        if (isNaN(shippingLength) || isNaN(shippingHeight) || isNaN(shippingWidth) || isNaN(shippingWeight)) {
            return NextResponse.json(
                { error: "Invalid shipping fields" },
                { status: 400 }
            );
        }

        // Handle image uploads
        const imageUrls: string[] = [...existingImages]; // Start with existing images

        // Upload new images to Firebase Storage
        for (const file of files) {
            const storageRef = ref(storage, `products/${vendorId}/${Date.now()}-${file.name}`);
            const uploadResult = await uploadBytes(storageRef, Buffer.from(await file.arrayBuffer()));
            const downloadUrl = await getDownloadURL(uploadResult.ref);
            imageUrls.push(downloadUrl);
        }

        // Ensure at least one image exists
        if (imageUrls.length === 0) {
            return NextResponse.json(
                { error: "At least one image is required." },
                { status: 400 }
            );
        }

        // Get vendor name
        const vendorDoc = await getDoc(doc(db, "vendors", vendorId));
        if (!vendorDoc.exists()) {
            return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
        }

        const vendorName = vendorDoc.data()?.storeName || "Unknown Vendor: " + vendorId;

        // Prepare updated product data
        const updatedProductData: Partial<T> = {
            name,
            price,
            vendorId,
            vendorName,
            quantityOptions,
            isDraft,
            shippingWeight,
            shippingLength,
            shippingWidth,
            shippingHeight,
            images: imageUrls,
        };

        // Add optional fields
        const optionalFields = [
            "shortDescription",
            "longDescription",
            "tags",
            "categories",
            "stockStatus",
            "processingTime",
            "upsells",
            "crossSells",
        ];

        for (const field of optionalFields) {
            const value = formData.get(field)?.toString();
            if (value) {
                if (field === "tags" || field === "categories" || field === "upsells" || field === "crossSells") {
                    updatedProductData[field] = JSON.parse(value);
                } else if (field === "stockStatus" || field === "processingTime" || field === "shortDescription" || field === "longDescription") {
                    updatedProductData[field] = value;
                }
            }
        }

        // Update product in Firestore
        await updateDoc(doc(db, "products", productId), updatedProductData);

        return NextResponse.json({ 
            data: { id: productId, ...updatedProductData },
            message: "Product updated successfully" 
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "An unknown error occurred." },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
    const user = await requireRole(request, "vendor");
    if (user instanceof NextResponse) return user;
    
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get("productId");
        const vendorId = searchParams.get("vendorId");

        if (!productId || !vendorId) {
            return NextResponse.json(
                { error: "Product ID and Vendor ID are required" },
                { status: 400 }
            );
        }

        // Check if product exists and user owns it
        const productDoc = await getDoc(doc(db, "products", productId));
        if (!productDoc.exists()) {
            return NextResponse.json({ error: "Product not found" }, { status: 404 });
        }

        const productData = productDoc.data();
        if (productData.vendorId !== vendorId) {
            return NextResponse.json({ error: "Unauthorized to delete this product" }, { status: 403 });
        }

        // Delete product from Firestore
        await deleteDoc(doc(db, "products", productId));

        // Remove product from vendor's products list
        await updateDoc(doc(db, "vendors", vendorId), {
            [`products.${productId}`]: null
        });

        return NextResponse.json({ 
            message: "Product deleted successfully" 
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "An unknown error occurred." },
            { status: 500 }
        );
    }
}


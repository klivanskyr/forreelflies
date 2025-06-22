import { db, storage } from "@/lib/firebase";
import {
    collection,
    getCountFromServer,
    getDocs,
    orderBy,
    query,
    where,
    doc,
    OrderByDirection,
    limit,
    startAfter,
    getDoc,
    addDoc,
    setDoc,
    getDocs as getOrderDocs,
    collection as orderCollection,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/app/api/utils/withRole";

type T = {
    name: string;
    price: number;
    vendorId: string;
    vendorName: string;
    quantityOptions: number[];
    isDraft: boolean;
    shippingWeight: number;
    shippingLength: number;
    shippingWidth: number;
    shippingHeight: number;
    images: string[];
    createdAt: Date;
    shortDescription?: string;
    longDescription?: string;
    tags?: string[];
    categories?: string[];
    stockStatus?: string;
    processingTime?: string;
    upsells?: string[];
    crossSells?: string[];
}

export async function GET(request: NextRequest): Promise<NextResponse> {
    const { pathname, searchParams } = new URL(request.url);
    if (pathname.endsWith("/top-selling")) {
        // Aggregate top-selling products from orders
        try {
            const orderDocs = await getOrderDocs(orderCollection(db, "orders"));
            const salesMap: Record<string, number> = {};
            orderDocs.forEach((doc) => {
                const order = doc.data();
                if (order.products) {
                    order.products.forEach((p: any) => {
                        salesMap[p.productId] = (salesMap[p.productId] || 0) + (p.quantity || 0);
                    });
                }
            });
            // Sort productIds by quantity sold
            const topProductIds = Object.entries(salesMap)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 6)
                .map(([productId]) => productId);
            let products: any[] = [];
            if (topProductIds.length > 0) {
                // Fetch product details for top sellers
                for (const productId of topProductIds) {
                    const productDoc = await getDoc(doc(db, "products", productId));
                    if (productDoc.exists()) {
                        products.push({ id: productDoc.id, ...productDoc.data() });
                    }
                }
            } else {
                // No sales yet, fallback to first 5 products
                const productsRef = collection(db, "products");
                const snapshot = await getDocs(query(productsRef, limit(5)));
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

        const tempPage = searchParams.get("page");
        const tempPageSize = searchParams.get("pageSize");

        // Parse the page and pageSize query parameters
        const page = tempPage ? parseInt(tempPage) : null;
        const pageSize = tempPageSize ? parseInt(tempPageSize) : null;

        // Sanity checks
        if (id && (vendorId || sort || page || pageSize)) {
            return NextResponse.json(
                { error: "The 'id' query parameter cannot be used with other query parameters" },
                { status: 400 }
            );
        }

        if (vendorId && (id || sort || page || pageSize)) {
            return NextResponse.json(
                { error: "The 'vendorId' query parameter cannot be used with other query parameters" },
                { status: 400 }
            );
        }

        // Handle single product fetch by ID
        if (id) {
            const docSnap = await getDoc(doc(db, "products", id));
            if (docSnap.exists()) {
                return NextResponse.json({ data: { id: docSnap.id, ...docSnap.data() } });
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
        let baseQuery = query(productsRef, orderBy(orderField, orderDirection));

        if (vendorId) {
            baseQuery = query(baseQuery, where("vendorId", "==", vendorId));
        }

        // Get the total number of items across all pages
        const totalCountSnapshot = await getCountFromServer(baseQuery);
        const totalItems = totalCountSnapshot.data().count;

        // Pagination logic
        let paginatedQuery = baseQuery;
        if (page && pageSize && page > 1) {
            // Iterate through pages to find the correct starting document
            const offset = (page - 1) * pageSize;
            const intermediateSnapshot = await getDocs(query(baseQuery, limit(offset)));
            const lastVisible = intermediateSnapshot.docs[intermediateSnapshot.docs.length - 1];

            if (lastVisible) {
                paginatedQuery = query(baseQuery, startAfter(lastVisible), limit(pageSize));
            } else {
                // No documents at this page
                return NextResponse.json({
                    data: [],
                    meta: {
                        page,
                        pageSize,
                        totalItems,
                        totalPages: Math.ceil(totalItems / pageSize),
                    },
                });
            }
        } else if (pageSize) {
            // First page
            paginatedQuery = query(baseQuery, limit(pageSize));
        } else if (page) {
            return NextResponse.json({ error: "pageSize is required when using the page parameter" }, { status: 400 });
        } else {
            // No pagination
            paginatedQuery = baseQuery;
        }

        const querySnapshot = await getDocs(paginatedQuery);
        const products: { [key: string]: Object }[] = [];
        querySnapshot.forEach((doc) => {
            products.push({ id: doc.id, ...doc.data() });
        });

        const totalPages = pageSize ? Math.ceil(totalItems / pageSize) : 1;

        const metadata = {
            page: page || 1,
            pageSize: pageSize || totalItems,
            totalItems,
            totalPages,
        };
        
        return NextResponse.json({
            data: products,
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

        if (files.length === 0) {
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

        const imageUrls: string[] = [];

        // Upload images to Firebase Storage
        for (const file of files) {
            const storageRef = ref(storage, `products/${vendorId}/${Date.now()}-${file.name}`);
            const uploadResult = await uploadBytes(storageRef, Buffer.from(await file.arrayBuffer()));
            const downloadUrl = await getDownloadURL(uploadResult.ref); // Get the download URL
            imageUrls.push(downloadUrl);
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
            images: imageUrls, // Store Firebase Storage URLs
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
        ];
        
        // Ugly but works
        for (const field of optionalFields) {
            const value = formData.get(field)?.toString();
            if (value) {
                if (field === "tags" || field === "categories" || field === "upsells" || field === "crossSells") {
                    productData[field] = JSON.parse(value);
                } else if (field === "stockStatus" || field === "processingTime" || field === "shortDescription" || field === "longDescription") {
                    productData[field] = value;
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


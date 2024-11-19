export type StockStatus = "inStock" | "outOfStock" | "unknown";

export type Product = {
    id?: string,
    name?: string, 
    shortDescription?: string,
    longDescription?: string,
    tags?: string[],
    catagories?: string[],
    price?: number,
    stockStatus?: StockStatus,
    vendorId?: string,
    shippingWeight?: number,
    shippingLength?: number,
    shippingWidth?: number,
    shippingHeight?: number,
    processingTime?: number,
    upsells?: Product[],
    crossSells?: Product[],
    isDraft?: boolean,
}

export type Vendor = {
    id?: string,
    ownerName?: string,
    ownerId?: string,
    products?: Product[],
    storeCity?: string,
    storeCountry?: string,
    storeDescription?: string,
    storeEmail?: string,
    storeName?: string,
    storePhone?: string,
    storeSlug?: string,
    storeState?: string,
    storeStreetAddress?: string,
    storeZip?: string,
}
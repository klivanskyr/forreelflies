'use server';

import { Layout, Product, Sort, ReviewSummary } from "@/app/types/types";
import BasicCard from "../cards/BasicCard";
import Link from "next/link";
import ClientAddToCartButton from "../buttons/ClientAddToCartButton";
import ProductListButtons from "./ProductListButtons";
import { FaStar, FaStarHalfAlt, FaRegStar, FaStore, FaShippingFast } from "react-icons/fa";

interface ProductListProps {
    sort: Sort;
    pageSize: number;
    page: number;
    layout: Layout;
    search?: string;
    category?: string;
    tag?: string;
}

// Fetch real vendor reviews from API
const getVendorReviews = async (vendorId: string): Promise<ReviewSummary> => {
    try {
        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/v1/vendor/reviews?vendorId=${vendorId}&pageSize=1`, {
            cache: 'no-store' // Don't cache to get fresh data
        });
        if (response.ok) {
            const data = await response.json();
            return data.summary || { averageRating: 0, totalReviews: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
        }
    } catch (error) {
        console.error('Error fetching vendor reviews:', error);
    }
    return { averageRating: 0, totalReviews: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
};

const StarRating = ({ rating, size = "sm" }: { rating: number, size?: "sm" | "lg" }) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    
    const starSize = size === "lg" ? "w-5 h-5" : "w-4 h-4";
    
    for (let i = 0; i < fullStars; i++) {
        stars.push(<FaStar key={`full-${i}`} className={`${starSize} text-yellow-400`} />);
    }
    
    if (hasHalfStar) {
        stars.push(<FaStarHalfAlt key="half" className={`${starSize} text-yellow-400`} />);
    }
    
    for (let i = 0; i < emptyStars; i++) {
        stars.push(<FaRegStar key={`empty-${i}`} className={`${starSize} text-gray-300`} />);
    }
    
    return <div className="flex items-center gap-1">{stars}</div>;
};

const ProductGridCard = async ({ product }: { product: Product }) => {
    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
    const discountPercentage = hasDiscount && product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
    const productReviews = product.reviewSummary || { averageRating: 0, totalReviews: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    const vendorReviews = await getVendorReviews(product.vendorId);

    return (
        <BasicCard className="w-full h-full hover:shadow-lg transition-shadow duration-300">
            <div className="h-full flex flex-col relative">
                {/* Discount Badge */}
                {hasDiscount && (
                    <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full z-10">
                        {discountPercentage}% OFF
                    </div>
                )}
                
                {/* Large Product Image */}
                {product?.images && (
                    <Link className="block relative overflow-hidden rounded-t-lg" href={`/product/${product.id}`}>
                        <div className="aspect-square bg-gray-100">
                            <img 
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                                src={product.images[0]} 
                                alt={product.name}
                            />
                        </div>
                    </Link>
                )}
                
                <div className="flex flex-col flex-1 p-4">
                    {/* Product Name */}
                    <Link href={`/product/${product.id}`} className="block mb-2">
                        <h3 className="font-bold text-lg text-gray-900 hover:text-green-600 transition-colors line-clamp-2">
                            {product.name}
                        </h3>
                    </Link>
                    
                    {/* Product Reviews */}
                    {productReviews.totalReviews > 0 && (
                        <div className="mb-2">
                            <div className="flex items-center gap-2">
                                <StarRating rating={productReviews.averageRating} />
                                <span className="text-xs text-gray-500">({productReviews.totalReviews})</span>
                            </div>
                        </div>
                    )}
                    
                    {/* Vendor Info */}
                    <div className="mb-3">
                        <Link 
                            href={`/vendor/${product.vendorId}`}
                            className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors mb-1"
                        >
                            <FaStore className="w-3 h-3" />
                            <span className="font-medium">{product.vendorName}</span>
                        </Link>
                        {vendorReviews.totalReviews > 0 ? (
                            <div className="flex items-center gap-2">
                                <StarRating rating={vendorReviews.averageRating} />
                                <span className="text-xs text-gray-500">
                                    Store: {vendorReviews.averageRating.toFixed(1)} ({vendorReviews.totalReviews})
                                </span>
                            </div>
                        ) : (
                            <div className="text-xs text-gray-400">New seller</div>
                        )}
                    </div>
                    
                    {/* Short Description */}
                    {product.shortDescription && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.shortDescription}</p>
                    )}
                    
                    {/* Tags and Categories */}
                    <div className="flex flex-wrap gap-1 mb-3">
                        {product.catagories?.slice(0, 2).map((cat, idx) => (
                            <span key={idx} className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                {cat}
                            </span>
                        ))}
                        {product.tags?.slice(0, 2).map((tag, idx) => (
                            <span key={idx} className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                {tag}
                            </span>
                        ))}
                    </div>
                    
                    {/* Price and Actions */}
                    <div className="mt-auto">
                        <div className="flex flex-col items-center gap-2 mb-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
                                {hasDiscount && product.originalPrice && (
                                    <span className="text-sm text-gray-500 line-through">${product.originalPrice.toFixed(2)}</span>
                                )}
                            </div>
                            {hasDiscount && product.originalPrice && (
                                <div className="text-sm text-green-600 font-medium">
                                    Save ${(product.originalPrice - product.price).toFixed(2)}!
                                </div>
                            )}
                        </div>
                        
                        <div className="flex flex-col gap-2">
                            <Link href={`/product/${product.id}`}>
                                <button className="w-full py-2 px-4 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                                    View Details
                                </button>
                            </Link>
                            <ClientAddToCartButton 
                                product={product} 
                                quantity={product.quantityOptions?.[0] || 1} 
                            />
                        </div>
                    </div>
                </div>
            </div>
        </BasicCard>
    );
};

const ProductListCard = async ({ product }: { product: Product }) => {
    const hasDiscount = product.originalPrice && product.originalPrice > product.price;
    const discountPercentage = hasDiscount && product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
    const productReviews = product.reviewSummary || { averageRating: 0, totalReviews: 0, ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
    const vendorReviews = await getVendorReviews(product.vendorId);

    return (
        <BasicCard className="w-full hover:shadow-lg transition-shadow duration-300">
            <div className="flex gap-6 p-6 relative">
                {/* Discount Badge */}
                {hasDiscount && (
                    <div className="absolute top-4 right-4 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10">
                        {discountPercentage}% OFF
                    </div>
                )}
                
                {/* Large Product Image */}
                {product?.images && (
                    <Link className="block relative overflow-hidden rounded-lg flex-shrink-0" href={`/product/${product.id}`}>
                        <div className="w-48 h-48 bg-gray-100">
                            <img 
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                                src={product.images[0]} 
                                alt={product.name}
                            />
                        </div>
                    </Link>
                )}
                
                <div className="flex-1 flex flex-col">
                    {/* Product Header */}
                    <div className="mb-4">
                        <Link href={`/product/${product.id}`} className="block mb-2">
                            <h3 className="font-bold text-xl text-gray-900 hover:text-green-600 transition-colors">
                                {product.name}
                            </h3>
                        </Link>
                        
                        {/* Product Reviews */}
                        {productReviews.totalReviews > 0 && (
                            <div className="flex items-center gap-2 mb-2">
                                <StarRating rating={productReviews.averageRating} size="lg" />
                                <span className="text-sm text-gray-600">
                                    {productReviews.averageRating.toFixed(1)} ({productReviews.totalReviews} reviews)
                                </span>
                            </div>
                        )}
                        
                        {/* Vendor Info with Reviews */}
                        <div className="flex items-center gap-4 mb-3">
                            <Link 
                                href={`/vendor/${product.vendorId}`}
                                className="flex items-center gap-2 text-sm text-gray-600 hover:text-green-600 transition-colors"
                            >
                                <FaStore className="w-4 h-4" />
                                <span className="font-medium">{product.vendorName}</span>
                            </Link>
                            {vendorReviews.totalReviews > 0 && (
                                <div className="flex items-center gap-2">
                                    <StarRating rating={vendorReviews.averageRating} />
                                    <span className="text-xs text-gray-500">
                                        Seller: {vendorReviews.averageRating.toFixed(1)} ({vendorReviews.totalReviews})
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Product Description */}
                    <div className="mb-4 flex-1">
                        {product.shortDescription && (
                            <p className="text-gray-700 mb-3 line-clamp-3">{product.shortDescription}</p>
                        )}
                        
                        {/* Tags and Categories */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {product.catagories?.slice(0, 3).map((cat, idx) => (
                                <span key={idx} className="inline-block bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full">
                                    {cat}
                                </span>
                            ))}
                            {product.tags?.slice(0, 3).map((tag, idx) => (
                                <span key={idx} className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full">
                                    {tag}
                                </span>
                            ))}
                        </div>
                        
                        {/* Recent Reviews Preview */}
                        {productReviews.totalReviews > 0 && (
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <h4 className="font-medium text-gray-900 mb-2">Customer Feedback</h4>
                                <p className="text-sm text-gray-600">
                                    {productReviews.totalReviews} customer{productReviews.totalReviews !== 1 ? 's have' : ' has'} reviewed this product
                                    {productReviews.averageRating >= 4 ? ' with mostly positive feedback' : 
                                     productReviews.averageRating >= 3 ? ' with mixed feedback' : 
                                     ' with varied feedback'}.
                                </p>
                            </div>
                        )}
                    </div>
                    
                    {/* Price and Actions */}
                    <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-200">
                        <div className="flex flex-col">
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-2xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
                                {hasDiscount && product.originalPrice && (
                                    <span className="text-lg text-gray-500 line-through">${product.originalPrice.toFixed(2)}</span>
                                )}
                            </div>
                            {hasDiscount && product.originalPrice && (
                                <div className="text-sm text-green-600 font-medium">
                                    Save ${(product.originalPrice - product.price).toFixed(2)} ({discountPercentage}% off)
                                </div>
                            )}
                        </div>
                        
                        <div className="flex gap-3">
                            <Link href={`/product/${product.id}`}>
                                <button className="px-6 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                                    View Details
                                </button>
                            </Link>
                            <ClientAddToCartButton 
                                product={product} 
                                quantity={product.quantityOptions?.[0] || 1} 
                            />
                        </div>
                    </div>
                </div>
            </div>
        </BasicCard>
    );
};

export default async function ProductList({ sort, pageSize, page, layout, search, category, tag }: ProductListProps) {
    const fetchProducts = async () => {
        // Build query parameters
        const params = new URLSearchParams();
        params.append('sort', sort);
        params.append('page', page.toString());
        
        if (pageSize !== -1) {
            params.append('pageSize', pageSize.toString());
        } else {
            params.append('pageSize', '-1');
        }
        
        if (search) params.append('search', search);
        if (category) params.append('category', category);
        if (tag) params.append('tag', tag);

        const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3001'}/api/v1/product?${params.toString()}`, {
            cache: 'no-store' // Ensure fresh data for search/filter results
        });
        
        if (!response.ok) {
            console.error("Error fetching products", response.status, response.statusText);
            return { data: [], meta: { totalItems: 0, totalPages: 0, page: 1, pageSize: pageSize } };
        }

        const data = await response.json();
        return { data: data.data, meta: data.meta };
    }

    const response = await fetchProducts();
    const products = response?.data || [];
    const meta = response?.meta || { totalItems: 0, totalPages: 0, page: 1, pageSize: pageSize };

    const getContainerClassName = () => {
        if (layout === 'list') {
            return "space-y-6";
        }
        
        switch (layout) {
            case "column":
                return "grid grid-cols-1 items-start justify-items-center mx-auto max-w-[500px] gap-6 px-4"
            case "grid2":
                return "grid grid-cols-1 md:grid-cols-2 items-start justify-items-center mx-auto max-w-4xl gap-6 px-4"
            case "grid3":
                return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-start justify-items-center mx-auto max-w-6xl gap-6 px-4"
            case "grid4":
                return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-start justify-items-center mx-auto max-w-7xl gap-6 px-4"
            default:
                return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-start justify-items-center mx-auto max-w-6xl gap-6 px-4"
        }
    }

    // Show active filters
    const activeFilters = [];
    if (search) activeFilters.push(`Search: "${search}"`);
    if (category) activeFilters.push(`Category: ${category}`);
    if (tag) activeFilters.push(`Tag: ${tag}`);

    return (
        <div className="mb-6 min-h-[70vh] flex flex-col justify-between w-full">
            {/* Results summary */}
            <div className="px-6 py-3 text-sm text-gray-600 border-b bg-gray-50 mx-auto max-w-7xl w-full">
                {meta.totalItems > 0 ? (
                    <span>
                        Showing {((meta.page - 1) * meta.pageSize) + 1}-{Math.min(meta.page * meta.pageSize, meta.totalItems)} of {meta.totalItems} products
                        {activeFilters.length > 0 && (
                            <span className="ml-2 text-green-600 font-medium">({activeFilters.join(', ')})</span>
                        )}
                    </span>
                ) : (
                    <span>
                        No products found
                        {activeFilters.length > 0 && (
                            <span className="ml-2 text-green-600 font-medium">for {activeFilters.join(', ')}</span>
                        )}
                    </span>
                )}
            </div>

            <div className="flex-1 py-8">
                <div className={getContainerClassName()}>
                    {products.length === 0 ? (
                        <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
                            <svg className="w-24 h-24 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                            </svg>
                            <h3 className="text-xl font-medium text-gray-900 mb-2">No products found</h3>
                            <p className="text-gray-500 mb-4">Try adjusting your search or filter to find what you're looking for.</p>
                            <Link 
                                href="/shop"
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                            >
                                Clear Filters
                            </Link>
                        </div>
                    ) : (
                        products.map((product: Product) => 
                            layout === 'list' ? (
                                <ProductListCard key={product.id} product={product} />
                            ) : (
                                <ProductGridCard key={product.id} product={product} />
                            )
                        )
                    )}
                </div>
            </div>
        </div>
    );
}
'use server';

import { Layout, Product, Sort, ReviewSummary } from "@/app/types/types";
import BasicCard from "../cards/BasicCard";
import Link from "next/link";
import ClientAddToCartButton from "../buttons/ClientAddToCartButton";
import ProductListButtons from "./ProductListButtons";
import { FaStar, FaStarHalfAlt, FaRegStar, FaStore, FaShippingFast, FaBox } from "react-icons/fa";
import Image from 'next/image';

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
    const isLowStock = product.stockQuantity && product.lowStockThreshold && product.stockQuantity <= product.lowStockThreshold;

    return (
        <BasicCard className="w-full h-full group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="h-full flex flex-col relative">
                {/* Badges Container */}
                <div className="absolute top-2 right-2 flex flex-col gap-1.5 z-10">
                    {hasDiscount && (
                        <div className="bg-red-500 text-white text-sm font-bold px-2 py-1 rounded-full shadow-md animate-bounce">
                            {discountPercentage}% OFF
                        </div>
                    )}
                    {isLowStock && (
                        <div className="bg-amber-500 text-white text-sm font-bold px-2 py-1 rounded-full shadow-md">
                            Low Stock
                        </div>
                    )}
                    {product.stockStatus === 'outOfStock' && (
                        <div className="bg-gray-500 text-white text-sm font-bold px-2 py-1 rounded-full shadow-md">
                            Out of Stock
                        </div>
                    )}
                </div>
                
                {/* Product Image with Hover Effect */}
                {product?.images && (
                    <Link className="block relative overflow-hidden rounded-t-lg group" href={`/product/${product.id}`}>
                        <div className="aspect-square bg-gray-50 relative h-[250px]">
                            <Image 
                                className="group-hover:scale-110 transition-transform duration-500 ease-out object-cover" 
                                src={product.images[0]} 
                                alt={product.name}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                priority
                            />
                            {product.images.length > 1 && (
                                <Image 
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out object-cover" 
                                    src={product.images[1]} 
                                    alt={`${product.name} alternate view`}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                />
                            )}
                        </div>
                    </Link>
                )}
                
                {/* Product Info */}
                <div className="p-3 flex flex-col flex-grow">
                    <Link href={`/product/${product.id}`} className="group">
                        <h3 className="text-lg font-medium text-gray-900 group-hover:text-green-600 line-clamp-1">{product.name}</h3>
                    </Link>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{product.shortDescription}</p>
                    
                    {/* Vendor Info */}
                    <div className="mt-2 flex items-center gap-1.5 text-sm">
                        <FaStore className="text-gray-400" />
                        <span className="text-gray-600">{product.vendorName}</span>
                    </div>
                    
                    {/* Ratings */}
                    <div className="mt-1.5 flex items-center gap-1">
                        <div className="flex text-amber-400">
                            {[...Array(5)].map((_, i) => (
                                <span key={i}>
                                    {i < Math.floor(productReviews.averageRating) ? (
                                        <FaStar />
                                    ) : i < productReviews.averageRating ? (
                                        <FaStarHalfAlt />
                                    ) : (
                                        <FaRegStar />
                                    )}
                                </span>
                            ))}
                        </div>
                        <span className="text-sm text-gray-500">({productReviews.totalReviews})</span>
                    </div>
                </div>
                
                {/* Price and Actions */}
                <div className="p-3 pt-0">
                    <div className="flex flex-col items-center gap-1.5 mb-3">
                        <div className="flex items-center gap-2">
                            <span className="text-xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
                            {hasDiscount && product.originalPrice && (
                                <span className="text-sm text-gray-500 line-through">${product.originalPrice.toFixed(2)}</span>
                            )}
                        </div>
                        {hasDiscount && product.originalPrice && (
                            <div className="text-xs text-green-600 font-semibold bg-green-50 px-2 py-0.5 rounded-full">
                                Save ${(product.originalPrice - product.price).toFixed(2)}!
                            </div>
                        )}
                    </div>
                    
                    <div className="flex flex-col gap-2">
                        <Link href={`/product/${product.id}`} className="w-full">
                            <button className="w-full py-2.5 px-6 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-300 hover:border-green-500 hover:text-green-600 font-medium text-base">
                                View Details
                            </button>
                        </Link>
                        <ClientAddToCartButton 
                            product={product} 
                            quantity={product.quantityOptions?.[0] || 1}
                            className="w-full py-2.5 px-6 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-300 font-medium shadow-md hover:shadow-lg text-base"
                        />
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
    const isLowStock = product.stockQuantity && product.lowStockThreshold && product.stockQuantity <= product.lowStockThreshold;

    return (
        <BasicCard className="w-full max-w-[1200px] mx-auto group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
            <div className="flex gap-8 p-6 relative">
                {/* Badges Container */}
                <div className="absolute top-4 right-4 flex flex-col gap-1.5 z-10">
                    {hasDiscount && (
                        <div className="bg-red-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-md animate-bounce">
                            {discountPercentage}% OFF
                        </div>
                    )}
                    {isLowStock && (
                        <div className="bg-amber-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-md">
                            Low Stock
                        </div>
                    )}
                    {product.stockStatus === 'outOfStock' && (
                        <div className="bg-gray-500 text-white text-sm font-bold px-3 py-1.5 rounded-full shadow-md">
                            Out of Stock
                        </div>
                    )}
                </div>
                
                {/* Product Image with Hover Effect */}
                {product?.images && (
                    <Link className="block relative overflow-hidden rounded-lg flex-shrink-0 group" href={`/product/${product.id}`}>
                        <div className="w-[300px] h-[300px] bg-gray-50 relative">
                            <Image 
                                className="group-hover:scale-110 transition-transform duration-500 ease-out object-cover rounded-lg shadow-md" 
                                src={product.images[0]} 
                                alt={product.name}
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 300px"
                                priority
                            />
                            {product.images.length > 1 && (
                                <Image 
                                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 ease-out object-cover rounded-lg shadow-md" 
                                    src={product.images[1]} 
                                    alt={`${product.name} alternate view`}
                                    fill
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 300px"
                                />
                            )}
                        </div>
                    </Link>
                )}
                
                {/* Product Info */}
                <div className="flex flex-col flex-grow min-w-0">
                    <div className="grid grid-cols-[1fr,auto] gap-6 mb-4">
                        {/* Left Column - Product Details */}
                        <div>
                            <Link href={`/product/${product.id}`} className="group">
                                <h3 className="text-2xl font-semibold text-gray-900 group-hover:text-green-600 transition-colors mb-2">
                                    {product.name}
                                </h3>
                            </Link>
                            
                            {/* Categories and Tags */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                {product.catagories?.map((cat, idx) => (
                                    <span key={idx} className="inline-block bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full font-medium">
                                        {cat}
                                    </span>
                                ))}
                                {product.tags?.map((tag, idx) => (
                                    <span key={idx} className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-medium">
                                        {tag}
                                    </span>
                                ))}
                            </div>

                            {/* Product Description */}
                            <p className="text-gray-700 text-base mb-4 line-clamp-3 group-hover:line-clamp-none transition-all duration-300">
                                {product.shortDescription}
                            </p>

                            {/* Ratings */}
                            <div className="flex items-center gap-3 mb-4">
                                <div className="flex text-amber-400">
                                    {[...Array(5)].map((_, i) => (
                                        <span key={i}>
                                            {i < Math.floor(productReviews.averageRating) ? (
                                                <FaStar className="w-5 h-5" />
                                            ) : i < productReviews.averageRating ? (
                                                <FaStarHalfAlt className="w-5 h-5" />
                                            ) : (
                                                <FaRegStar className="w-5 h-5" />
                                            )}
                                        </span>
                                    ))}
                                </div>
                                <span className="text-sm text-gray-600">
                                    {productReviews.averageRating > 0 
                                        ? `${productReviews.averageRating.toFixed(1)} (${productReviews.totalReviews} reviews)` 
                                        : 'No ratings yet'}
                                </span>
                            </div>
                        </div>

                        {/* Right Column - Price and Actions */}
                        <div className="flex flex-col items-end gap-4">
                            <div className="text-right">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-3xl font-bold text-gray-900">${product.price.toFixed(2)}</span>
                                    {hasDiscount && product.originalPrice && (
                                        <span className="text-lg text-gray-500 line-through">${product.originalPrice.toFixed(2)}</span>
                                    )}
                                </div>
                                {hasDiscount && product.originalPrice && (
                                    <div className="text-sm text-green-600 font-semibold bg-green-50 px-3 py-1.5 rounded-full inline-block">
                                        Save ${(product.originalPrice - product.price).toFixed(2)}!
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col gap-2 w-[200px]">
                                <Link href={`/product/${product.id}`} className="w-full">
                                    <button className="w-full py-2.5 px-6 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-300 hover:border-green-500 hover:text-green-600 font-medium">
                                        View Details
                                    </button>
                                </Link>
                                <ClientAddToCartButton 
                                    product={product} 
                                    quantity={product.quantityOptions?.[0] || 1}
                                    className="w-full py-2.5 px-6 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors duration-300 font-medium shadow-md hover:shadow-lg"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Vendor Info */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                        <div className="flex items-center justify-between mb-2">
                            <Link 
                                href={`/vendor/${product.vendorId}`}
                                className="flex items-center gap-2 text-gray-700 hover:text-green-600 transition-colors"
                            >
                                <FaStore className="w-5 h-5" />
                                <span className="font-medium text-lg">{product.vendorName}</span>
                            </Link>
                            {vendorReviews.averageRating >= 4.5 && (
                                <div className="text-sm text-green-600 font-medium flex items-center gap-1">
                                    <FaShippingFast className="w-4 h-4" />
                                    Highly Rated Seller
                                </div>
                            )}
                        </div>
                        {vendorReviews.totalReviews > 0 ? (
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <div className="flex text-amber-400">
                                        {[...Array(5)].map((_, i) => (
                                            <span key={i}>
                                                {i < Math.floor(vendorReviews.averageRating) ? (
                                                    <FaStar className="w-4 h-4" />
                                                ) : i < vendorReviews.averageRating ? (
                                                    <FaStarHalfAlt className="w-4 h-4" />
                                                ) : (
                                                    <FaRegStar className="w-4 h-4" />
                                                )}
                                            </span>
                                        ))}
                                    </div>
                                    <span className="text-base font-medium text-gray-700">
                                        {vendorReviews.averageRating.toFixed(1)}
                                    </span>
                                </div>
                                <span className="text-sm text-gray-500">
                                    Based on {vendorReviews.totalReviews} reviews
                                </span>
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500 italic">New seller - No reviews yet</div>
                        )}
                    </div>

                    {/* Stock Status */}
                    {product.stockQuantity !== undefined && (
                        <div className="mt-4">
                            <div className="flex items-center gap-2 text-sm">
                                <FaBox className="text-gray-400" />
                                <span className="text-gray-600">
                                    {product.stockQuantity > 0 
                                        ? `${product.stockQuantity} in stock`
                                        : 'Out of stock'}
                                </span>
                                {isLowStock && (
                                    <span className="text-amber-500 font-medium">
                                        (Low stock - order soon)
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </BasicCard>
    );
};

export default async function  ProductList({ sort, pageSize, page, layout, search, category, tag }: ProductListProps) {
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
            return "w-full space-y-6 px-4 xl:px-6";
        }
        
        switch (layout) {
            case "column":
                return "w-full grid grid-cols-1 items-start justify-items-center gap-6 px-4 xl:px-6 max-w-2xl mx-auto"
            case "grid2":
                return "w-full grid grid-cols-1 md:grid-cols-2 items-start justify-items-center gap-6 px-4 xl:px-6"
            case "grid3":
                return "w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-start justify-items-center gap-6 px-4 xl:px-6"
            case "grid4":
                return "w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-start justify-items-center gap-6 px-4 xl:px-6"
            default:
                return "w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 items-start justify-items-center gap-6 px-4 xl:px-6"
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
            <div className="px-6 py-3 text-sm text-gray-600 border-b bg-gray-50 w-full">
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

            <div className="flex-1 py-8 w-full">
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
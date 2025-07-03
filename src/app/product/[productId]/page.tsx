'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FaStore, FaCheckCircle, FaClock, FaHeart, FaShare, FaStar } from 'react-icons/fa'
import { BiSupport } from 'react-icons/bi'
import { Product, ReviewSummary } from '@/app/types/types'
import { ProductInfo } from '@/components/ProductInfo'
import { useParams } from 'next/navigation'
import ProductReviews from '@/components/ProductReviews'
import Image from 'next/image'
import toast from 'react-hot-toast'

const StarRating = ({ rating, size = "sm" }: { rating: number, size?: "xs" | "sm" | "lg" }) => {
    const stars = []
    const sizeClass = size === "lg" ? "w-6 h-6" : size === "xs" ? "w-3 h-3" : "w-4 h-4"
    
    for (let i = 1; i <= 5; i++) {
        stars.push(
            <FaStar 
                key={i} 
                className={`${sizeClass} ${i <= rating ? 'text-yellow-400' : 'text-gray-300'}`} 
            />
        )
    }
    
    return <div className="flex gap-1">{stars}</div>
}

export default function ProductPage() {
    const params = useParams()
    const productId = params.productId as string
    
    const [product, setProduct] = useState<Product | null>(null)
    const [vendorReviews, setVendorReviews] = useState<ReviewSummary>({ 
        averageRating: 0, 
        totalReviews: 0, 
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } 
    })
    const [productReviews, setProductReviews] = useState<ReviewSummary>({ 
        averageRating: 0, 
        totalReviews: 0, 
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } 
    })
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const [activeTab, setActiveTab] = useState('description')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch product data
                const productRes = await fetch(`/api/v1/product?id=${productId}`)
                if (productRes.ok) {
                    const productData = await productRes.json()
                    setProduct(productData)
                    setProductReviews({
                        averageRating: productData.reviewSummary?.averageRating || 0,
                        totalReviews: productData.reviewSummary?.totalReviews || 0,
                        ratingDistribution: productData.reviewSummary?.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
                    })
                    
                    // Fetch vendor reviews
                    try {
                        const vendorRes = await fetch(`/api/v1/vendor/reviews?vendorId=${productData.vendorId}&pageSize=1`)
                        if (vendorRes.ok) {
                            const vendorData = await vendorRes.json()
                            if (vendorData.summary) {
                                setVendorReviews({
                                    averageRating: vendorData.summary.averageRating || 0,
                                    totalReviews: vendorData.summary.totalReviews || 0,
                                    ratingDistribution: vendorData.summary.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
                                })
                            }
                        }
                    } catch (err) {
                        console.log('Vendor reviews not available');
                    }
                } else {
                    throw new Error('Product not found')
                }
            } catch (error) {
                console.error('Error fetching product data:', error);
                toast.error('Failed to load product. Please try again or go back to shop.');
            } finally {
                setLoading(false);
            }
        }

        if (productId) {
            fetchData()
        }
    }, [productId])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Loading...</div>
            </div>
        )
    }

    if (!product) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-xl">Product not found</div>
            </div>
        )
    }

    const hasDiscount = product.originalPrice && product.originalPrice > product.price
    const discountPercentage = hasDiscount ? Math.round(((product.originalPrice! - product.price) / product.originalPrice!) * 100) : 0

    return (
        <div className="min-h-screen bg-gray-50 w-full">
            {/* Breadcrumbs */}
            <div className="bg-white border-b w-full">
                <div className="w-full px-4 py-4">
                    <nav className="flex text-sm text-gray-600">
                        <Link href="/" className="hover:text-green-600">Home</Link>
                        <span className="mx-2">/</span>
                        <Link href="/shop" className="hover:text-green-600">Shop</Link>
                        <span className="mx-2">/</span>
                        <span className="text-gray-900">{product.name}</span>
                    </nav>
                </div>
            </div>

            <div className="w-full px-4 py-8">
                {/* Main Product Section */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                        {/* Interactive Image Gallery - Takes 5 columns on xl screens */}
                        <div className="xl:col-span-5 p-8">
                            <div className="sticky top-8">
                                <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4 relative">
                                    {hasDiscount && (
                                        <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-2 rounded-full z-10">
                                            {discountPercentage}% OFF
                                        </div>
                                    )}
                                    {product.images && product.images.length > 0 && (
                                        <div className="relative w-full h-full">
                                            <Image 
                                                src={product.images[selectedImageIndex]} 
                                                alt={product.name} 
                                                fill
                                                className="object-contain hover:scale-105 transition-transform duration-300"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                            />
                                        </div>
                                    )}
                                </div>
                                
                                {/* Thumbnail Images */}
                                {product.images && product.images.length > 1 && (
                                    <div className="grid grid-cols-4 gap-2">
                                        {product.images.map((image, idx) => (
                                            <div 
                                                key={idx} 
                                                className={`aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-200 relative ${
                                                    selectedImageIndex === idx ? 'border-green-600 ring-2 ring-green-200' : 'border-transparent hover:border-gray-300'
                                                }`}
                                                onClick={() => setSelectedImageIndex(idx)}
                                            >
                                                <Image 
                                                    src={image} 
                                                    alt={`${product.name} ${idx + 1}`} 
                                                    fill
                                                    className="object-cover hover:scale-105 transition-transform duration-300"
                                                    sizes="(max-width: 768px) 25vw, (max-width: 1200px) 20vw, 15vw"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Product Info - Takes 7 columns on xl screens */}
                        <div className="xl:col-span-7 p-8">
                            <div className="max-w-3xl">
                                <div className="mb-6">
                                    <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>
                                    
                                    {/* Product Reviews */}
                                    {productReviews.totalReviews > 0 ? (
                                        <div className="flex items-center gap-3 mb-4">
                                            <StarRating rating={productReviews.averageRating || 0} size="lg" />
                                            <span className="text-lg text-gray-600">
                                                {(productReviews.averageRating || 0).toFixed(1)} ({productReviews.totalReviews} reviews)
                                            </span>
                                        </div>
                                    ) : (
                                        <div className="text-gray-500 mb-4">No reviews yet</div>
                                    )}
                                </div>

                                {/* Quick Description */}
                                <div className="prose prose-lg max-w-none mb-8">
                                    <p className="text-gray-700">{product.longDescription}</p>
                                </div>

                                {/* Price and Stock Status */}
                                <div className="bg-gray-50 rounded-xl p-6 mb-8">
                                    <div className="flex flex-wrap items-center gap-6 mb-4">
                                        <div>
                                            <div className="flex items-center gap-4">
                                                <span className="text-4xl font-bold text-gray-900">${(product.price || 0).toFixed(2)}</span>
                                                {hasDiscount && product.originalPrice && (
                                                    <span className="text-xl text-gray-500 line-through">${(product.originalPrice || 0).toFixed(2)}</span>
                                                )}
                                            </div>
                                            {hasDiscount && product.originalPrice && (
                                                <div className="text-green-600 text-lg font-medium mt-1">
                                                    You save ${((product.originalPrice || 0) - (product.price || 0)).toFixed(2)}!
                                                </div>
                                            )}
                                        </div>
                                        <div className={`px-4 py-2 rounded-full ${(product.stockStatus === 'inStock' || !product.stockStatus) ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            <div className="flex items-center gap-2">
                                                {(product.stockStatus === 'inStock' || !product.stockStatus) ? (
                                                    <>
                                                        <FaCheckCircle className="w-5 h-5" />
                                                        <span className="font-medium">In Stock</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <FaClock className="w-5 h-5" />
                                                        <span className="font-medium">Out of Stock</span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-4">
                                        <ProductInfo product={product} />
                                        
                                        <div className="flex gap-3 pt-4">
                                            <button className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                                <FaHeart className="w-4 h-4" />
                                                <span>Add to Wishlist</span>
                                            </button>
                                            <button className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                                <FaShare className="w-4 h-4" />
                                                <span>Share</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Vendor Info Card */}
                                <div className="bg-gray-50 rounded-xl p-6 mb-8">
                                    <Link 
                                        href={`/vendor/${product.vendorId}`}
                                        className="flex items-center gap-4 hover:text-green-600 transition-colors"
                                    >
                                        <div className="bg-white p-3 rounded-full">
                                            <FaStore className="w-6 h-6 text-green-600" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="font-semibold text-xl">{product.vendorName}</h3>
                                                {vendorReviews.totalReviews > 0 && (
                                                    <div className="flex items-center gap-1">
                                                        <StarRating rating={vendorReviews.averageRating || 0} size="xs" />
                                                        <span className="text-sm text-gray-600">
                                                            {(vendorReviews.averageRating || 0).toFixed(1)} ({vendorReviews.totalReviews})
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500">Visit Store</p>
                                        </div>
                                    </Link>
                                    
                                    {vendorReviews.totalReviews === 0 && (
                                        <div className="text-sm text-gray-500 mt-2">New seller</div>
                                    )}
                                </div>

                                {/* Tags and Categories */}
                                <div className="mb-8">
                                    <h3 className="font-semibold text-lg mb-3">Categories & Tags</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {product.catagories?.map((cat, idx) => (
                                            <Link 
                                                key={idx} 
                                                href={`/shop?category=${cat}`}
                                                className="inline-block bg-green-100 text-green-800 text-sm px-4 py-2 rounded-full hover:bg-green-200 transition-colors"
                                            >
                                                {cat}
                                            </Link>
                                        ))}
                                        {product.tags?.map((tag, idx) => (
                                            <Link 
                                                key={idx} 
                                                href={`/shop?tag=${tag}`}
                                                className="inline-block bg-blue-100 text-blue-800 text-sm px-4 py-2 rounded-full hover:bg-blue-200 transition-colors"
                                            >
                                                {tag}
                                            </Link>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detailed Information Tabs */}
                <div className="bg-white rounded-xl shadow-lg">
                    <div className="border-b border-gray-200">
                        <nav className="flex flex-wrap space-x-8 px-8">
                            <button 
                                onClick={() => setActiveTab('description')}
                                className={`py-4 px-3 border-b-2 font-medium text-base transition-colors ${
                                    activeTab === 'description' 
                                        ? 'border-green-600 text-green-600' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Full Description
                            </button>
                            <button 
                                onClick={() => setActiveTab('specifications')}
                                className={`py-4 px-3 border-b-2 font-medium text-base transition-colors ${
                                    activeTab === 'specifications' 
                                        ? 'border-green-600 text-green-600' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Specifications
                            </button>
                            <button 
                                onClick={() => setActiveTab('reviews')}
                                className={`py-4 px-3 border-b-2 font-medium text-base transition-colors ${
                                    activeTab === 'reviews' 
                                        ? 'border-green-600 text-green-600' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Reviews ({productReviews.totalReviews})
                            </button>
                            <button 
                                onClick={() => setActiveTab('vendor')}
                                className={`py-4 px-3 border-b-2 font-medium text-base transition-colors ${
                                    activeTab === 'vendor' 
                                        ? 'border-green-600 text-green-600' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Vendor Info
                            </button>
                        </nav>
                    </div>
                    
                    <div className="p-8">
                        {/* Full Description Tab */}
                        {activeTab === 'description' && (
                            <div className="w-full mx-auto">
                                <h2 className="text-3xl font-bold mb-6">Product Description</h2>
                                <div className="prose prose-lg max-w-none">
                                    <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{product.longDescription}</p>
                                </div>
                            </div>
                        )}
                        
                        {/* Specifications Tab */}
                        {activeTab === 'specifications' && (
                            <div className="w-full mx-auto">
                                <h2 className="text-3xl font-bold mb-6">Product Specifications</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-gray-50 p-6 rounded-xl">
                                        <h3 className="text-xl font-semibold mb-4">Shipping Information</h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Weight:</span>
                                                <span className="font-medium">{product.shippingWeight || 'Not specified'} {product.shippingWeight ? 'lbs' : ''}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Processing Time:</span>
                                                <span className="font-medium">{product.processingTime || 'Not specified'} {product.processingTime ? 'days' : ''}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-gray-50 p-6 rounded-xl">
                                        <h3 className="text-xl font-semibold mb-4">Product Details</h3>
                                        <div className="space-y-3">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Stock Status:</span>
                                                <span className="font-medium">{(product.stockStatus === 'inStock' || !product.stockStatus) ? 'In Stock' : 'Out of Stock'}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Categories:</span>
                                                <span className="font-medium">{product.catagories?.join(', ') || 'Not categorized'}</span>
                                            </div>
                                            {product.stockQuantity !== undefined && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Available Quantity:</span>
                                                    <span className="font-medium">{product.stockQuantity} units</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Reviews Tab */}
                        {activeTab === 'reviews' && (
                            <div className="w-full mx-auto">
                                <ProductReviews productId={productId} productName={product.name} />
                            </div>
                        )}
                        
                        {/* Vendor Info Tab */}
                        {activeTab === 'vendor' && (
                            <div className="w-full mx-auto">
                                <h2 className="text-3xl font-bold mb-6">About the Seller</h2>
                                <div className="bg-gray-50 p-8 rounded-xl">
                                    <div className="flex items-center gap-6 mb-6">
                                        <div className="bg-white p-4 rounded-full">
                                            <FaStore className="w-10 h-10 text-green-600" />
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-4 mb-2">
                                                <h3 className="text-2xl font-semibold">{product.vendorName}</h3>
                                                {vendorReviews.totalReviews > 0 && (
                                                    <div className="flex items-center gap-2">
                                                        <StarRating rating={vendorReviews.averageRating || 0} />
                                                        <span className="text-gray-600">
                                                            {(vendorReviews.averageRating || 0).toFixed(1)} ({vendorReviews.totalReviews} reviews)
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            {vendorReviews.totalReviews === 0 && (
                                                <div className="text-gray-500 mb-4">New seller on our platform</div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <Link 
                                            href={`/vendor/${product.vendorId}`}
                                            className="inline-block bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
                                        >
                                            Visit Store
                                        </Link>
                                        <button className="inline-block bg-white text-gray-700 px-8 py-3 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors font-medium">
                                            Contact Seller
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
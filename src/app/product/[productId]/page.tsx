'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { FaStore, FaCheckCircle, FaClock, FaHeart, FaShare, FaStar } from 'react-icons/fa'
import { BiSupport } from 'react-icons/bi'
import { Product, ReviewSummary } from '@/app/types/types'
import { ProductInfo } from '@/components/ProductInfo'
import { useParams } from 'next/navigation'
import ProductReviews from '@/components/ProductReviews'

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
                        console.log('Vendor reviews not available')
                    }
                }
            } catch (error) {
                console.error('Error fetching product data:', error)
            } finally {
                setLoading(false)
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
        <div className="min-h-screen bg-gray-50">
            {/* Breadcrumbs */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <nav className="flex text-sm text-gray-600">
                        <Link href="/" className="hover:text-green-600">Home</Link>
                        <span className="mx-2">/</span>
                        <Link href="/shop" className="hover:text-green-600">Shop</Link>
                        <span className="mx-2">/</span>
                        <span className="text-gray-900">{product.name}</span>
                    </nav>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Main Product Section */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Interactive Image Gallery */}
                        <div className="p-8">
                            <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-4 relative">
                                {hasDiscount && (
                                    <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-2 rounded-full z-10">
                                        {discountPercentage}% OFF
                                    </div>
                                )}
                                {product.images && product.images.length > 0 && (
                                    <img 
                                        src={product.images[selectedImageIndex]} 
                                        alt={product.name} 
                                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                                    />
                                )}
                            </div>
                            
                            {/* Thumbnail Images */}
                            {product.images && product.images.length > 1 && (
                                <div className="grid grid-cols-4 gap-2">
                                    {product.images.map((image, idx) => (
                                        <div 
                                            key={idx} 
                                            className={`aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer border-2 transition-all duration-200 ${
                                                selectedImageIndex === idx ? 'border-green-600 ring-2 ring-green-200' : 'border-transparent hover:border-gray-300'
                                            }`}
                                            onClick={() => setSelectedImageIndex(idx)}
                                        >
                                            <img 
                                                src={image} 
                                                alt={`${product.name} ${idx + 1}`} 
                                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" 
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {/* Product Info */}
                        <div className="p-8">
                            <div className="mb-4">
                                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                                
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

                            {/* Vendor Info Card */}
                            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                <div className="flex items-center justify-between mb-3">
                                    <Link 
                                        href={`/vendor/${product.vendorId}`}
                                        className="flex items-center gap-3 hover:text-green-600 transition-colors"
                                    >
                                        <FaStore className="w-5 h-5 text-green-600" />
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-lg">{product.vendorName}</h3>
                                                {vendorReviews.totalReviews > 0 && (
                                                    <div className="flex items-center gap-1">
                                                        <StarRating rating={vendorReviews.averageRating || 0} size="xs" />
                                                        <span className="text-xs text-gray-600">
                                                            {(vendorReviews.averageRating || 0).toFixed(1)} ({vendorReviews.totalReviews})
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-500">Visit Store</p>
                                        </div>
                                    </Link>
                                    <BiSupport className="w-6 h-6 text-gray-400" />
                                </div>
                                
                                {vendorReviews.totalReviews === 0 && (
                                    <div className="text-sm text-gray-500">New seller</div>
                                )}
                            </div>

                            {/* Price */}
                            <div className="mb-6">
                                <div className="flex items-center gap-4 mb-2">
                                    <span className="text-4xl font-bold text-gray-900">${(product.price || 0).toFixed(2)}</span>
                                    {hasDiscount && product.originalPrice && (
                                        <span className="text-xl text-gray-500 line-through">${(product.originalPrice || 0).toFixed(2)}</span>
                                    )}
                                </div>
                                {hasDiscount && product.originalPrice && (
                                    <div className="text-green-600 text-lg font-medium">
                                        You save ${((product.originalPrice || 0) - (product.price || 0)).toFixed(2)}!
                                    </div>
                                )}
                            </div>

                            {/* Stock Status */}
                            <div className="mb-6">
                                {(product.stockStatus === 'inStock' || !product.stockStatus) ? (
                                    <div className="flex items-center gap-2 text-green-600">
                                        <FaCheckCircle className="w-5 h-5" />
                                        <span className="font-medium">In Stock</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-red-600">
                                        <FaClock className="w-5 h-5" />
                                        <span className="font-medium">Out of Stock</span>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            <div className="mb-6">
                                <h3 className="font-semibold text-lg mb-2">Description</h3>
                                <p className="text-gray-700 line-clamp-4">{product.longDescription}</p>
                            </div>

                            {/* Tags and Categories */}
                            <div className="mb-6">
                                <div className="flex flex-wrap gap-2">
                                    {product.catagories?.map((cat, idx) => (
                                        <Link 
                                            key={idx} 
                                            href={`/shop?category=${cat}`}
                                            className="inline-block bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full hover:bg-green-200 transition-colors"
                                        >
                                            {cat}
                                        </Link>
                                    ))}
                                    {product.tags?.map((tag, idx) => (
                                        <Link 
                                            key={idx} 
                                            href={`/shop?tag=${tag}`}
                                            className="inline-block bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full hover:bg-blue-200 transition-colors"
                                        >
                                            {tag}
                                        </Link>
                                    ))}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-4">
                                <ProductInfo product={product} />
                                
                                <div className="flex gap-3 pt-4">
                                    <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                                        <FaHeart className="w-4 h-4" />
                                        <span>Wishlist</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Interactive Tabs Section */}
                <div className="bg-white rounded-xl shadow-lg">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-8">
                            <button 
                                onClick={() => setActiveTab('description')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === 'description' 
                                        ? 'border-green-600 text-green-600' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Full Description
                            </button>
                            <button 
                                onClick={() => setActiveTab('specifications')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === 'specifications' 
                                        ? 'border-green-600 text-green-600' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Specifications
                            </button>
                            <button 
                                onClick={() => setActiveTab('reviews')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                                    activeTab === 'reviews' 
                                        ? 'border-green-600 text-green-600' 
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                Reviews ({productReviews.totalReviews})
                            </button>
                            <button 
                                onClick={() => setActiveTab('vendor')}
                                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
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
                            <div>
                                <h2 className="text-2xl font-bold mb-4">Product Description</h2>
                                <div className="prose max-w-none">
                                    <p className="text-gray-700 leading-relaxed">{product.longDescription}</p>
                                </div>
                            </div>
                        )}
                        
                        {/* Specifications Tab */}
                        {activeTab === 'specifications' && (
                            <div>
                                <h2 className="text-2xl font-bold mb-4">Specifications</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="font-semibold mb-2">Shipping Details</h3>
                                        <p className="text-gray-700">Weight: {product.shippingWeight || 'Not specified'} {product.shippingWeight ? 'lbs' : ''}</p>
                                        <p className="text-gray-700">Processing Time: {product.processingTime || 'Not specified'} {product.processingTime ? 'days' : ''}</p>
                                    </div>
                                    <div className="bg-gray-50 p-4 rounded-lg">
                                        <h3 className="font-semibold mb-2">Product Info</h3>
                                        <p className="text-gray-700">Stock Status: {(product.stockStatus === 'inStock' || !product.stockStatus) ? 'In Stock' : 'Out of Stock'}</p>
                                        <p className="text-gray-700">Categories: {product.catagories?.join(', ') || 'Not categorized'}</p>
                                    </div>
                                </div>
                            </div>
                        )}
                        
                        {/* Reviews Tab */}
                        {activeTab === 'reviews' && (
                            <div>
                                <ProductReviews productId={productId} productName={product.name} />
                            </div>
                        )}
                        
                        {/* Vendor Info Tab */}
                        {activeTab === 'vendor' && (
                            <div>
                                <h2 className="text-2xl font-bold mb-4">Vendor Information</h2>
                                <div className="bg-gray-50 p-6 rounded-lg">
                                    <div className="flex items-center gap-4 mb-4">
                                        <FaStore className="w-8 h-8 text-green-600" />
                                        <div>
                                            <div className="flex items-center gap-3">
                                                <h3 className="text-xl font-semibold">{product.vendorName}</h3>
                                                {vendorReviews.totalReviews > 0 && (
                                                    <div className="flex items-center gap-1">
                                                        <StarRating rating={vendorReviews.averageRating || 0} size="xs" />
                                                        <span className="text-sm text-gray-600">
                                                            {(vendorReviews.averageRating || 0).toFixed(1)} ({vendorReviews.totalReviews} reviews)
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            {vendorReviews.totalReviews === 0 && (
                                                <div className="text-gray-500 mt-1">New seller</div>
                                            )}
                                        </div>
                                    </div>
                                    <Link 
                                        href={`/vendor/${product.vendorId}`}
                                        className="inline-block bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        Visit Store
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
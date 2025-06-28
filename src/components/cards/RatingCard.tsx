import Image from 'next/image'
import placeholder from '@/../public/placeholder.png'
import Stars from './Stars'
import { Product } from '@/app/types/types'
import ClientAddToCartButton from '../buttons/ClientAddToCartButton'
import Link from 'next/link'

interface RatingCardProps {
    className?: string;
    title: string;
    rating: number;
    vendorName: string;
    price: string;
    image?: string;
    product?: Product; // Optional product object for discount info
}

export default function Card({ className="", title, rating, vendorName, price, image, product }: RatingCardProps) {
    // Check if product has discount info
    const hasDiscount = product?.originalPrice && product.originalPrice > product.price;
    const discountPercentage = hasDiscount && product?.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0;
    
    if (!product) return null; // Don't render if no product data

    return (
        <div className={`${className} flex flex-col items-center p-5 gap-3 border rounded-md relative`}>
            {/* Discount Badge */}
            {hasDiscount && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded z-10">
                    {discountPercentage}% OFF
                </div>
            )}
            
            <Link href={`/product/${product.id}`} className="relative w-[250px] h-[200px] cursor-pointer">
                <Image src={image || placeholder.src} alt={title} fill className="object-contain hover:scale-105 transition-transform duration-300" /> 
            </Link>
            <Link href={`/product/${product.id}`}>
                <h3 className='font-semibold text-xl text-center hover:text-green-600 transition-colors'>{title}</h3>
            </Link>
            <div className='flex flex-col gap-1 items-center w-full'>
                <Stars className='text-4xl' rating={rating} />
                <h4 className='text-black text-opacity-80 text-lg'>Vendor: <span className='font-semibold'>{vendorName}</span></h4>
                
                {/* Price Display with Discount */}
                <div className="flex flex-col items-center gap-1">
                    <div className="flex items-center gap-2">
                        <h4 className='text-lg font-bold text-gray-900'>${price}</h4>
                        {hasDiscount && product?.originalPrice && (
                            <span className="text-sm text-gray-500 line-through">${product.originalPrice.toFixed(2)}</span>
                        )}
                    </div>
                    {hasDiscount && product?.originalPrice && (
                        <div className="text-xs text-green-600 font-medium">
                            Save ${(product.originalPrice - product.price).toFixed(2)}!
                        </div>
                    )}
                </div>
                
                <div className="flex flex-col gap-2 w-full">
                    <Link href={`/product/${product.id}`} className="w-full">
                        <button className="w-full py-2 px-4 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg transition-all duration-300 hover:border-green-500 hover:text-green-600 font-medium">
                            View Details
                        </button>
                    </Link>
                    <ClientAddToCartButton 
                        product={product}
                        quantity={product.quantityOptions?.[0] || 1}
                        className={`w-full py-2 px-4 ${product.stockStatus === 'outOfStock' ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} text-white rounded-lg transition-colors duration-300 font-medium shadow-md hover:shadow-lg`}
                    />
                </div>
            </div>
        </div>
    )
}
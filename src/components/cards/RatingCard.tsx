import Image from 'next/image'
import placeholder from '@/../public/placeholder.png'
import Stars from './Stars'
import { Product } from '@/app/types/types'

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
    
    return (
        <div className={`${className} flex flex-col items-center p-5 gap-3 border rounded-md relative`}>
            {/* Discount Badge */}
            {hasDiscount && (
                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded z-10">
                    {discountPercentage}% OFF
                </div>
            )}
            
            <div className='relative w-[250px] h-[200px]'>
                <Image src={image || placeholder.src} alt="product" fill /> 
            </div>
            <h3 className='font-semibold text-xl text-center'>{title}</h3>
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
                
                <button className='greenButton w-full mt-2'>Add to Cart</button>
            </div>
        </div>
    )
}
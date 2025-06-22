import Image from 'next/image'
import placeholder from '@/../public/placeholder.png'
import Stars from './Stars'

export default function Card({ className="", title, rating, vendorName, price, image }: { className?: string, title: string, rating: number, vendorName: string, price: string, image?: string }) {
    return (
        <div className={`${className} flex flex-col items-center p-5 gap-3 border rounded-md`}>
            <div className='relative w-[250px] h-[200px]'>
                <Image src={image || placeholder.src} alt="product" fill /> 
            </div>
            <h3 className='font-semibold text-xl'>{title}</h3>
            <div className='flex flex-col gap-1 items-center w-full'>
                <Stars className='text-4xl' rating={rating} />
                <h4 className='text-black text-opacity-80 text-lg'>Vendor: <span className='font-semibold'>{vendorName}</span></h4>
                <h4 className='text-lg text-black text-opacity-80'>${price}</h4>
                <button className='greenButton w-full mt-2'>Add to Cart</button>
            </div>
        </div>
    )
}
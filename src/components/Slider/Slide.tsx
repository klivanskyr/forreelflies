import Image from 'next/image';

export default function Slide({ className="", backgroundSrc, children }: { className?: string, backgroundSrc?: string, children: React.ReactNode }) {
    return (
        <div className={`${className} w-full h-full relative`}>
            <Image 
                className="object-fill" 
                draggable="false" 
                src={backgroundSrc || ""} 
                alt="Background"
                fill
                priority
                sizes="100vw"
            />
            <div className="absolute w-full h-full bg-black bg-opacity-40 -z-10"></div>
            {children}
        </div>
    )
}
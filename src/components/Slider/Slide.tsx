import Image from 'next/image';

export default function Slide({ className="", backgroundSrc, children }: { className?: string, backgroundSrc?: string, children: React.ReactNode }) {
    return (
        <div className={`${className} w-screen h-[80vh] relative`}>
            <Image 
                className="object-cover" 
                draggable="false" 
                src={backgroundSrc || ""} 
                alt="Background"
                fill
                priority
                sizes="100vw"
                quality={100}
            />
            <div className="absolute inset-0 bg-black bg-opacity-40 z-10"></div>
            <div className="absolute inset-0 z-20 flex items-center justify-center">
                {children}
            </div>
        </div>
    );
}
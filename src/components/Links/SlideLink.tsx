import Link from "next/link";
import Image from "next/image";

export default function SlideLink({ link="", backgroundSrc, children }: { link?: string, backgroundSrc?: string, children: React.ReactNode }) {
    return (
        <Link href={link} className="group relative w-full h-full overflow-hidden transition-all flex justify-center items-center">
            <Image 
                src={backgroundSrc || ""} 
                alt="slide" 
                draggable="false" 
                className="z-0 group-hover:scale-110 transition-all duration-300 object-cover" 
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            <div className="group-hover:bg-opacity-0 transition-all absolute w-full h-full bg-black bg-opacity-40 z-10"></div>
            <div className="z-20 flex flex-col w-full h-full justify-center items-center absolute top-0 left-0">
                {children}
            </div>
        </Link>
    )
}
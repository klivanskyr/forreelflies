import Image from "next/image";

export default function Slide({ className="", backgroundSrc, children }: { className?: string, backgroundSrc?: string, children: React.ReactNode }) {
    return (
        <div className={`${className} relative w-full h-full`}>
            <Image className="-z-10" src={backgroundSrc || ""} alt="slide" fill />
            {children}
        </div>
    )
}
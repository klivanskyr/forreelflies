import Image from "next/image";

export default function Slide({ backgroundSrc, children }: { backgroundSrc?: string, children: React.ReactNode }) {
    return (
        <div className="relative w-full h-full">
            <Image className="-z-10" src={backgroundSrc || ""} alt="slide" fill />
            {children}
        </div>
    )
}
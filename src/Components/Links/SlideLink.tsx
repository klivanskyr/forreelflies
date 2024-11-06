import Image from "next/image";

export default function SlideLink({ backgroundSrc, children }: { backgroundSrc?: string, children: React.ReactNode }) {
    return (
        <div className="group relative w-full h-full min-h-[200px] min-w-[200px] overflow-hidden transition-all">
            <Image className="z-0 group-hover:scale-150 transition-all" src={backgroundSrc || ""} alt="slide" fill />
            <div className="group-hover:bg-opacity-0 transition-all absolute w-full h-full bg-black bg-opacity-50 z-10"></div>
            <div className="z-20 flex flex-col w-full h-full justify-center items-center absolute top-0 left-0">
                {children}
            </div>
        </div>
    )
}
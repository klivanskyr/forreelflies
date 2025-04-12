export default function SlideLink({ backgroundSrc, children }: { backgroundSrc?: string, children: React.ReactNode }) {
    return (
        <div className="group relative w-full h-full overflow-hidden transition-all">
            <img src={backgroundSrc || ""} alt="slide" draggable="false" className="z-0 group-hover:scale-125 transition-all duration-300 object-cover w-full h-full" />
            <div className="group-hover:bg-opacity-0 transition-all absolute w-full h-full bg-black bg-opacity-50 z-10"></div>
            <div className="z-20 flex flex-col w-full h-full justify-center items-center absolute top-0 left-0">
                {children}
            </div>
        </div>
    )
}
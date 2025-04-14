export default function Slide({ className="", backgroundSrc, children }: { className?: string, backgroundSrc?: string, children: React.ReactNode }) {
    return (
        <div className={`${className} w-full h-full`}>
            <img className="absolute w-full h-full object-fill -z-50" draggable="false" src={backgroundSrc || ""} />
            <div className="absolute w-full h-full bg-black bg-opacity-40 -z-10"></div>
            {children}
        </div>
    )
}
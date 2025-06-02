export default function Slide({ className="", backgroundSrc, children }: { className?: string, backgroundSrc?: string, children: React.ReactNode }) {
    return (
        <div className={`${className} w-full h-full`}
            style={{
                WebkitUserSelect: "none", // Safari
                MozUserSelect: "none",    // Firefox
                msUserSelect: "none",     // IE/Edge
                userSelect: "none",       // Standard
            }}
        >
            <img className="absolute w-full h-full object-fill -z-50" draggable="false" src={backgroundSrc || ""} />
            <div className="absolute w-full h-full bg-black bg-opacity-40 -z-10"></div>
            {children}
        </div>
    )
}
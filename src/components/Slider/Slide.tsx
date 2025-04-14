export default function Slide({ className="", backgroundSrc, children }: { className?: string, backgroundSrc?: string, children: React.ReactNode }) {
    return (
        <div className={`${className} w-full h-full`}>
            <img className="absolute w-full h-full object-fill -z-50" draggable="false" src={backgroundSrc || ""} />
            {children}
        </div>
    )
}
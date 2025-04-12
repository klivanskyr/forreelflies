export default function Slide({ className="", backgroundSrc, children }: { className?: string, backgroundSrc?: string, children: React.ReactNode }) {
    return (
        <div className={`${className} w-full h-full`}>
            <img className="w-full h-full object-fill" draggable="false" src={backgroundSrc || ""} />
            {children}
        </div>
    )
}
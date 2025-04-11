export default function Slide({ className="", backgroundSrc, children }: { className?: string, backgroundSrc?: string, children: React.ReactNode }) {
    return (
        <div className={`${className} relative w-full h-full`}>
            <img className="w-full h-full object-fill" src={backgroundSrc || ""} />
            {children}
        </div>
    )
}
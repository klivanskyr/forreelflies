export default function Stars({ rating, className="" }: { rating: number, className?: string }) {
    return (
        <div>
            {[...Array(5)].map((_, index) => {
                if (index < rating) {
                    return <span key={index} className={`${className} text-yellow-400`}>★</span>
                }
                return <span key={index} className={`${className} text-gray-300`}>★</span>
            })}
        </div>
    )
}
import Link from "next/link";

export default function Breadcrumbs({ breadcrumbs, activeIndex=0 }: { breadcrumbs: { name: string, href: string }[], activeIndex?: number }) {
    return (
        <div className="flex flex-row gap-3 items-center text-2xl mb-12">
            {breadcrumbs.map((breadcrumb, index) => (
                <div key={index} className="flex flex-row gap-2 items-center">
                    <Link href={breadcrumb.href} 
                        className={`${index <= activeIndex ? "text-black" : "text-gray-600"}`}
                    >
                            {(index + 1).toString() + " " + breadcrumb.name}
                    </Link>
                    {index !== breadcrumbs.length - 1 && <span className={`${index < activeIndex ? "text-black" : "text-gray-600"}`}>&gt;</span>}
                </div>
            ))}
        </div>
    )
}
"use client";

export default function BasicCard({ className="", children }: { className?: string, children: React.ReactNode }) {
    return (
        <div className={`${className} flex flex-col w-full h-full border border-gray-200 shadow-sm hover:shadow-lg rounded-lg bg-white transition-all duration-300 min-w-0`}>
            {children}
        </div>
    )
}
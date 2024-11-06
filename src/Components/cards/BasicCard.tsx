export default function BasicCard({ className="", children }: { className?: string, children: React.ReactNode }) {
    return (
        <div className={`${className} flex flex-col w-fit h-fit px-8 py-6 border-[0.1rem] shadow-card rounded-lg items-center`}>
            {children}
        </div>
    )
}
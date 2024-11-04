import Link from "next/link";

type Color = "green" | "white";

export default function ButtonLink({ className="", href, text, bgColor="green" }: { className?: string, href: string; text: string, bgColor?: Color }) {
    return (
        <Link href={href}>
            <button className={`${bgColor === "green" ? "bg-greenPrimary text-white" : "bg-white text-greenPrimary"} ${className} px-4 py-2 rounded-full text-center align-middle `}>{text}</button>
        </Link>
    )
}
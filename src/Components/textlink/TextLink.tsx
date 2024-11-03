import Link from "next/link";

import "./textlink.css";

export default function TextLink({ href, text, className="" }: { href: string; text: string, className?: string }) {
    return (
        <Link href={href}>
            <h1 className={`linkhover ${className}`}>{text}</h1>
        </Link>
    )
}
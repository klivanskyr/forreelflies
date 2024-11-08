import Link from "next/link";

import "./textlink.css";

export default function TextLink({ startingIcon, href, text, className="", onClick }: { startingIcon?: JSX.Element, href: string; text: string, className?: string, onClick?: () => void }) {
    return (
        <Link href={href} onClick={onClick} className="w-fit">
            <div className={`linkhover flex flex-row items-center gap-2 ${className}`}>
                {startingIcon ? startingIcon : <></>}
                <h1 className="text-lg">{text}</h1>
            </div>
        </Link>
    )
}
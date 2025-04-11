'use client';

import Link from "next/link";
import { usePathname } from "next/navigation";

type ClassNames = {
    wrapper?: string,
    link?: string,
    div?: string,
    text?: string,
    pathWrapper?: string,
    pathLink?: string,
    pathDiv?: string,
    pathText?: string
}

const defaultClassNames: ClassNames = {
    wrapper: "",
    link: "",
    div: "",
    text: "",
    pathWrapper: "",
    pathLink: "",
    pathDiv: "",
    pathText: ""
}

export default function PathHighlightTextLink({ classNames=defaultClassNames, startingIcon, href, text, path, onClick }: { classNames?: ClassNames, startingIcon?: JSX.Element, href: string; text: string, path: string, onClick?: () => void }) {
    const currentPath = usePathname();
    
    return (
        <div className={`${classNames.wrapper || ""} ${path === currentPath ? classNames.pathWrapper || "" : "" }`}>
            <Link href={href} onClick={onClick} className={`${classNames.link || ""} ${path === currentPath ? classNames.pathLink || "" : "" }`}>
                <div className={`linkhover flex flex-row items-center gap-2 ${classNames.div || ""} ${path === currentPath ? classNames.pathDiv || "" : "" }`}>
                    {startingIcon ? startingIcon : <></>}
                    <h1 className={`${classNames.text || ""} ${path === currentPath ? classNames.pathText || "" : "" }`}>{text}</h1>
                </div>
            </Link>
        </div>
    )
}
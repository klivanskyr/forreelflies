'use client';

import { useRouter } from "next/navigation";

export default function NoXRedirect<T>({ children, x, redirectUrl, alertMessage }: { children: React.ReactNode, x: T, redirectUrl: string, alertMessage?: string }) {
    const router = useRouter();

    if (!x) {
        if (alertMessage) {
            // alert(alertMessage);
        }
        router.push(redirectUrl);
        return <></>
    }

    return (
        <>
            {children}
        </>
    )
}
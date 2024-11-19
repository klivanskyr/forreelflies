import { useEffect } from "react";

export default function Modal({ children, open, setOpen, className="" }: { children: React.ReactNode, open: boolean, setOpen: (open: boolean) => void, className?: string }) {
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = "scroll"
            };
        } else {
            document.body.style.overflow = "scroll";
        }
    }, [open]);

    return (
        <>
            {open && (
                <>
                    <div className="fixed top-0 left-0 w-full h-full bg-black/[.25] z-[999]" onClick={() => setOpen(false)} />
                    <div className={`${className} fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[1000] bg-white p-4`}>
                        {children}
                    </div>
                </>
            )}
        </>
    )
}
'use client';

import { motion, AnimatePresence } from "framer-motion"
import { useEffect } from "react";

export default function Topbar({ className="", open, setOpen, children }: { className?: string, open: boolean, setOpen: (open: boolean) => void, children: React.ReactNode }) {

    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "scroll"
        };
    }, []);

    return (
        <>
            <AnimatePresence>
                {open && (
                    <>
                        <motion.div 
                            className={`${className} fixed top-0 left-0 w-full h-[90%] z-[1000] bg-white overflow-y-scroll`}
                            initial={{ top: "-50%", opacity: 0 }}
                            animate={{ top: 0, opacity: 1 }}
                            exit={{ top: "-50%", opacity: 0 }}
                            transition={{ duration: 0.5, type: "spring", stiffness: 100, damping: 20 }}
                        >   
                            <div className="flex flex-col items-center w-full h-full">
                                <div className="flex flex-row justify-end w-full px-8">
                                    <button className="mt-3 ml-5 text-xl 2xl:text-2xl font-semibold " onClick={() => setOpen(false)}>X</button>
                                </div>
                                <div className="flex flex-col w-full h-full p-8">
                                    {children}
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 z-[999]"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25, ease: "circInOut" }}
                            onClick={() => setOpen(false)}
                        />
                    </>
                )}
            </AnimatePresence> 
        </>
    )
}
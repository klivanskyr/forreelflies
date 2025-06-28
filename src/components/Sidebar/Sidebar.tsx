'use client';

import { motion, AnimatePresence } from "framer-motion"
import { useEffect } from "react";
import { IoClose } from "react-icons/io5";

export default function Sidebar({ open, setOpen, children }: { open: boolean, setOpen: (open: boolean) => void, children: React.ReactNode }) {
    useEffect(() => {
        if (open) {
            document.body.style.overflow = "hidden";
            return () => {
                document.body.style.overflow = "unset";
            };
        } else {
            document.body.style.overflow = "unset";
        }
    }, [open]);
    
    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Sidebar Panel */}
                    <motion.div 
                        className="fixed top-0 right-0 w-full sm:w-[400px] lg:w-[450px] h-full z-[1000] bg-white shadow-2xl"
                        initial={{ x: "100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "100%" }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                    >   
                        <div className="flex flex-col h-full relative">
                            <button 
                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
                                onClick={() => setOpen(false)}
                            >
                                <IoClose className="w-6 h-6" />
                            </button>
                            {children}
                        </div>
                    </motion.div>

                    {/* Backdrop */}
                    <motion.div
                        className="fixed inset-0 bg-black/50 z-[999] backdrop-blur-sm"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setOpen(false)}
                    />
                </>
            )}
        </AnimatePresence>
    );
}
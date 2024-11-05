import { motion, AnimatePresence } from "framer-motion"

export default function Sidebar({ open, setOpen, children }: { open: boolean, setOpen: (open: boolean) => void, children: React.ReactNode }) {
    return (
        <>
            <AnimatePresence>
                {open && (
                    <>
                        <motion.div 
                            className="fixed top-0 right-0 w-[40%] 2xl:w-[35%] h-dvh z-[1000] bg-white"
                            initial={{ right: "-30%", opacity: 0 }}
                            animate={{ right: 0, opacity: 1 }}
                            exit={{ right: "-30%", opacity: 0 }}
                            transition={{ duration: 0.5, ease: "circOut" }}
                        >   
                            <div className="flex flex-col items-start w-full h-full">
                                <button className="mt-3 ml-5 text-xl font-semibold" onClick={() => setOpen(false)}>X</button>
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
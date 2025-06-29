'use client';

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { wrap } from "popmotion";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function Slider({ children }: { children: React.ReactNode[] }) {
    const [[page, direction], setPage] = useState([0, 0]);
    const [isAnimating, setIsAnimating] = useState(false);
    const imageIndex = wrap(0, children.length, page); 

    const paginate = useCallback(
        (newDirection: number) => {
            if (isAnimating) return;
            setPage([page + newDirection, newDirection]);
            setIsAnimating(true); 
        },
        [page, isAnimating]
    );


    useEffect(() => {
        const interval = setInterval(() => {
            paginate(1);
        }, 5000);
    
        return () => clearInterval(interval);
    }, [page, paginate]);

    const variants = {
        enter: (direction: number) => ({
            x: direction > 0 ? 1000 : -1000,
            opacity: 0
        }),
        center: {
            zIndex: 1,
            x: 0,
            opacity: 1
        },
        exit: (direction: number) => ({
            zIndex: 0,
            x: direction < 0 ? 1000 : -1000,
            opacity: 0
        })
    };  

    const swipeConfidenceThreshold = 10000;
    const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity;

    return (
        <div className="relative w-screen h-[80vh] overflow-hidden">
            <AnimatePresence initial={false} custom={direction} onExitComplete={() => setIsAnimating(false)}>
                <motion.div
                    key={page}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                        x: { type: "spring", stiffness: 300, damping: 30 },
                        opacity: { duration: 0.2 }
                    }}
                    drag={!isAnimating ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={1}
                    onDragEnd={(e, { offset, velocity }) => {
                        const swipe = swipePower(offset.x, velocity.x);
                        if (swipe < -swipeConfidenceThreshold) {
                            paginate(1);
                        } else if (swipe > swipeConfidenceThreshold) {
                            paginate(-1);
                        }
                    }}
                    style={{
                        position: 'absolute',
                        width: '100vw',
                        height: '80vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {children[imageIndex]}
                </motion.div>
            </AnimatePresence>
            
            <button className="z-40 absolute right-4 top-1/2 -translate-y-1/2" onClick={() => paginate(1)}>
                <FaChevronRight className="fill-white w-[35px] h-[35px]" />
            </button>
            <button className="z-40 absolute left-4 top-1/2 -translate-y-1/2" onClick={() => paginate(-1)}>
                <FaChevronLeft className="fill-white w-[35px] h-[35px]" />
            </button>
        </div>
    );
}

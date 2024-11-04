'use client';

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { wrap } from "popmotion";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function Slider({ children }: { children: React.ReactNode[] }) {
    const [[page, direction], setPage] = useState([0, 0]);
    const imageIndex = wrap(0, children.length, page); // Use wrap to loop through the children

    useEffect(() => {
        const interval = setInterval(() => {
            paginate(1);
        }, 5000);
    
        return () => clearInterval(interval);
    }, [page]);

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

    const paginate = (newDirection: number) => {
        setPage([page + newDirection, newDirection]);
    };

    const swipeConfidenceThreshold = 10000;
    const swipePower = (offset: number, velocity: number) => Math.abs(offset) * velocity;

    return (
        <div className="relative w-full min-h-dvh overflow-hidden">
            <AnimatePresence initial={false} custom={direction}>
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
                    drag="x"
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
                        width: '100%',
                        height: '100%',
                        backgroundColor: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        fontSize: '24px',
                    }}
                >
                    {children[imageIndex]}
                </motion.div>
            </AnimatePresence>
            <button className="z-40" onClick={() => paginate(-1)} style={{ position: 'absolute', left: '10px', top: '50%' }}><FaChevronLeft /></button>
            <button className="z-40" onClick={() => paginate(1)} style={{ position: 'absolute', right: '10px', top: '50%' }}><FaChevronRight /></button>
        </div>
    );
}

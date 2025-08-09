'use client';

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { wrap } from "popmotion";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

export default function Slider({ children, autoSlide = true, showDots = false, height = "h-[60vh] md:h-[80vh]" }: { children: React.ReactNode[], autoSlide?: boolean, showDots?: boolean, height?: string }) {
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
        if (!autoSlide) return; // Only auto-slide if autoSlide is true
        
        const interval = setInterval(() => {
            paginate(1);
        }, 5000);
    
        return () => clearInterval(interval);
    }, [page, paginate, autoSlide]);

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
        <div className={`relative w-full ${height} overflow-hidden ${showDots ? 'pb-24' : ''}`}>
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
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    {children[imageIndex]}
                </motion.div>
            </AnimatePresence>
            
            {/* Desktop only arrows - hidden on mobile */}
            <button className="z-40 absolute right-2 md:right-4 top-1/2 -translate-y-1/2 !hidden md:!block" onClick={() => paginate(1)}>
                <FaChevronRight className="fill-white w-[35px] h-[35px]" />
            </button>
            <button className="z-40 absolute left-2 md:left-4 top-1/2 -translate-y-1/2 !hidden md:!block" onClick={() => paginate(-1)}>
                <FaChevronLeft className="fill-white w-[35px] h-[35px]" />
            </button>

            {/* Pagination Dots - Only show if showDots is true and there are multiple slides */}
            {showDots && children.length > 1 && (
                <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 z-50 flex items-center gap-2">
                    {Array.from({ length: children.length }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => {
                                setPage([i, i > page ? 1 : -1]);
                                setIsAnimating(true);
                            }}
                            className={`w-3 h-3 rounded-full transition-all duration-300 ${
                                i === imageIndex
                                    ? 'bg-green-600 scale-125 shadow-lg'
                                    : 'bg-gray-400 hover:bg-gray-500'
                            }`}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

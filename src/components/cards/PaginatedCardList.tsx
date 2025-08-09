'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export default function PaginatedCardList({ children }: { children: React.ReactNode[] }) {
    const [currentPage, setCurrentPage] = useState(0);
    const [cardWidth, setCardWidth] = useState(300); // Default card width
    const [cardsPerPage, setCardsPerPage] = useState(4); // Default cards per page
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const [touchEnd, setTouchEnd] = useState<number | null>(null);

    const childrenArray = React.Children.toArray(children);
    const hasItems = childrenArray.length > 0;

    useEffect(() => {
        const updateCardLayout = () => {
            const isMobile = window.innerWidth < 768;
            let containerWidth, newCardsPerPage, newCardWidth;
            
            if (isMobile) {
                // Mobile: Single card per page, full width with minimal spacing
                containerWidth = window.innerWidth - 32; // Reduced padding for more space
                newCardsPerPage = 1;
                newCardWidth = containerWidth;
            } else {
                // Desktop: Multiple cards per page
                containerWidth = Math.min(window.innerWidth * 0.8, 1200); // Max 1200px
                newCardsPerPage = Math.min(4, Math.floor(containerWidth / 280)); // Max 4 cards per page
                newCardWidth = containerWidth / newCardsPerPage;
            }

            setCardsPerPage(newCardsPerPage);
            setCardWidth(newCardWidth - 8); // Reduced margin for mobile
        };

        updateCardLayout(); // Set initial layout
        window.addEventListener('resize', updateCardLayout);

        return () => window.removeEventListener('resize', updateCardLayout);
    }, []);

    const numPages = Math.ceil(childrenArray.length / cardsPerPage);

    const handleDecrement = () => {
        if (numPages > 1) {
            setCurrentPage((prev) => (prev > 0 ? prev - 1 : numPages - 1));
        }
    };

    const handleIncrement = () => {
        if (numPages > 1) {
            setCurrentPage((prev) => (prev < numPages - 1 ? prev + 1 : 0));
        }
    };

    // Touch handlers for mobile swipe
    const onTouchStart = (e: React.TouchEvent) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e: React.TouchEvent) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = useCallback(() => {
        if (!touchStart || !touchEnd) return;
        
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > 50;
        const isRightSwipe = distance < -50;

        if (isLeftSwipe && currentPage < numPages - 1) {
            setCurrentPage(prev => prev + 1);
        } else if (isRightSwipe && currentPage > 0) {
            setCurrentPage(prev => prev - 1);
        }
    }, [touchStart, touchEnd, currentPage, numPages]);

    // Don't show anything if no items
    if (!hasItems) {
        return null;
    }

    return (
        <div className="flex flex-col items-center w-full max-w-full overflow-hidden">
            <div className="flex items-center gap-2 md:gap-4 w-full justify-center">
                {/* Only show arrows if there are multiple pages - hidden on mobile */}
                {numPages > 1 && (
                    <button 
                        onClick={handleDecrement}
                        className="hidden md:flex items-center justify-center p-3 md:p-2 rounded-lg hover:bg-gray-100 transition-colors bg-white shadow-sm border"
                    >
                        <FaChevronLeft className="w-5 h-5 md:w-4 md:h-4 text-gray-700 hover:text-gray-900" />
                    </button>
                )}
                
                <div
                    className="grid overflow-hidden w-full max-w-full"
                    style={{
                        gridTemplateColumns: `repeat(${Math.min(cardsPerPage, childrenArray.length)}, ${cardWidth}px)`,
                        width: `${Math.min(cardsPerPage, childrenArray.length) * cardWidth}px`,
                        maxWidth: '100%',
                    }}
                >
                    {childrenArray
                        .slice(currentPage * cardsPerPage, (currentPage + 1) * cardsPerPage)
                        .map((child, index) => (
                            <div key={index} className="flex-shrink-0 mx-[4px]">
                                {child}
                            </div>
                        ))}
                </div>
                
                {/* Only show arrows if there are multiple pages - hidden on mobile */}
                {numPages > 1 && (
                    <button 
                        onClick={handleIncrement}
                        className="hidden md:flex items-center justify-center p-3 md:p-2 rounded-lg hover:bg-gray-100 transition-colors bg-white shadow-sm border"
                    >
                        <FaChevronRight className="w-5 h-5 md:w-4 md:h-4 text-gray-700 hover:text-gray-900" />
                    </button>
                )}
            </div>
            
            {/* Show page indicator if there are multiple pages - hidden on mobile */}
            {numPages > 1 && (
                <div className="hidden md:flex mt-4 md:mt-6 items-center gap-2 justify-center">
                    {Array.from({ length: numPages }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentPage(i)}
                            className={`w-2 h-2 md:w-3 md:h-3 rounded-full transition-colors ${
                                i === currentPage ? 'bg-gray-800' : 'bg-gray-300 hover:text-gray-500'
                            }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

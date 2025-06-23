'use client';

import React, { useEffect, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export default function PaginatedCardList({ children }: { children: React.ReactNode[] }) {
    const [currentPage, setCurrentPage] = useState(0);
    const [cardWidth, setCardWidth] = useState(300); // Default card width
    const [cardsPerPage, setCardsPerPage] = useState(4); // Default cards per page

    const childrenArray = React.Children.toArray(children);
    const hasItems = childrenArray.length > 0;

    useEffect(() => {
        const updateCardLayout = () => {
            const containerWidth = window.innerWidth * 0.8; // Adjust container width based on screen width
            const newCardsPerPage = Math.min(5, Math.floor(containerWidth / 300)); // Max 5 cards per page
            const newCardWidth = containerWidth / newCardsPerPage;

            setCardsPerPage(newCardsPerPage);
            setCardWidth(newCardWidth - 4); // Subtract 4px for margin
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

    // Don't show anything if no items
    if (!hasItems) {
        return null;
    }

    return (
        <div className="flex flex-col items-center">
            <div className="flex items-center gap-4">
                {/* Only show arrows if there are multiple pages */}
                {numPages > 1 && (
                    <button 
                        onClick={handleDecrement}
                        className="flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <FaChevronLeft className="text-gray-700 hover:text-gray-900" />
                    </button>
                )}
                
                <div
                    className="grid overflow-hidden"
                    style={{
                        gridTemplateColumns: `repeat(${Math.min(cardsPerPage, childrenArray.length)}, ${cardWidth}px)`,
                        width: `${Math.min(cardsPerPage, childrenArray.length) * cardWidth}px`,
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
                
                {/* Only show arrows if there are multiple pages */}
                {numPages > 1 && (
                    <button 
                        onClick={handleIncrement}
                        className="flex items-center justify-center p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <FaChevronRight className="text-gray-700 hover:text-gray-900" />
                    </button>
                )}
            </div>
            
            {/* Show page indicator if there are multiple pages */}
            {numPages > 1 && (
                <div className="mt-4 flex items-center gap-2">
                    {Array.from({ length: numPages }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentPage(i)}
                            className={`w-2 h-2 rounded-full transition-colors ${
                                i === currentPage ? 'bg-gray-800' : 'bg-gray-300 hover:bg-gray-500'
                            }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

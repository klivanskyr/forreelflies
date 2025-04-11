'use client';

import React, { useEffect, useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

export default function PaginatedCardList({ children }: { children: React.ReactNode[] }) {
    const [currentPage, setCurrentPage] = useState(0);
    const [cardWidth, setCardWidth] = useState(300); // Default card width
    const [cardsPerPage, setCardsPerPage] = useState(4); // Default cards per page

    useEffect(() => {
        const updateCardLayout = () => {
            const containerWidth = window.innerWidth * 0.8; // Adjust container width based on screen width
            const newCardsPerPage = Math.min(5, Math.floor(containerWidth / 300)); // Max 5 cards per page
            const newCardWidth = containerWidth / newCardsPerPage;

            setCardsPerPage(newCardsPerPage);
            setCardWidth(newCardWidth - 4); // Subtract 20px for margin
        };

        updateCardLayout(); // Set initial layout
        window.addEventListener('resize', updateCardLayout);

        return () => window.removeEventListener('resize', updateCardLayout);
    }, []);

    const numPages = Math.ceil(React.Children.count(children) / cardsPerPage);

    const handleDecrement = () => {
        setCurrentPage((prev) => (prev > 0 ? prev - 1 : numPages - 1));
    };

    const handleIncrement = () => {
        setCurrentPage((prev) => (prev < numPages - 1 ? prev + 1 : 0));
    };

    return (
        <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
                <button onClick={handleDecrement}>
                    <FaChevronLeft />
                </button>
                <div
                    className="grid overflow-hidden"
                    style={{
                        gridTemplateColumns: `repeat(${cardsPerPage}, ${cardWidth}px)`,
                        width: `${cardsPerPage * cardWidth}px`, // Container width to fit exactly `cardsPerPage` cards
                    }}
                >
                    {React.Children.toArray(children)
                        .slice(currentPage * cardsPerPage, (currentPage + 1) * cardsPerPage)
                        .map((child, index) => (
                            <div key={index} className="flex-shrink-0 mx-[4px]">
                                {child}
                            </div>
                        ))}
                </div>
                <button onClick={handleIncrement}>
                    <FaChevronRight />
                </button>
            </div>
        </div>
    );
}

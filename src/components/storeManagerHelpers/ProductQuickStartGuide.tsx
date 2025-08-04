"use client";

import React, { useState, useEffect } from "react";
import { FaArrowRight, FaArrowLeft } from "react-icons/fa";

export interface TourStep {
    selector: string;
    title: string;
    description: string;
}

interface ProductQuickStartGuideProps {
    onClose: () => void;
    steps?: TourStep[];
    currentStep?: number;
    onStepChange?: (step: number) => void;
}

// Define defaultSteps BEFORE the component
const defaultSteps: TourStep[] = [
    {
        selector: "[data-tour='products']",
        title: "Add Your First Product",
        description: "Click here to add a new product to your store. You can upload images, set pricing, and manage inventory.",
    },
    {
        selector: "[data-tour='orders']",
        title: "View Orders",
        description: "Track and manage all your customer orders from this section.",
    },
    {
        selector: "[data-tour='reviews']",
        title: "Check Reviews",
        description: "See what customers are saying about your products and respond to reviews.",
    },
    {
        selector: "[data-tour='payments']",
        title: "Manage Payments",
        description: "View your earnings and manage your Stripe payment setup here.",
    },
];

export default function ProductQuickStartGuide({ 
    onClose, 
    steps = defaultSteps,
    currentStep,
    onStepChange 
}: ProductQuickStartGuideProps) {
    const [internalStep, setInternalStep] = useState(0);
    const step = currentStep ?? internalStep;
    const [rect, setRect] = useState<DOMRect | null>(null);
    const [currentElement, setCurrentElement] = useState<Element | null>(null);

    // Handle step changes
    const handleStepChange = (newStep: number) => {
        if (onStepChange) {
            onStepChange(newStep);
        } else {
            setInternalStep(newStep);
        }
    };

    const handleNext = () => {
        if (step === steps.length - 1) {
            onClose();
        } else {
            handleStepChange(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 0) {
            handleStepChange(step - 1);
        }
    };

    useEffect(() => {
        const updateRect = () => {
            const el = document.querySelector(steps[step].selector);
            if (el) {
                setCurrentElement(el);
                el.scrollIntoView({ behavior: "smooth", block: "center" });
                setRect(el.getBoundingClientRect());
                
                // Remove previous highlights
                document.querySelectorAll('[data-tour]').forEach(element => {
                    element.classList.remove('relative', 'z-[10000]');
                });
                
                // Add highlight to current element - make it appear above the overlay
                el.classList.add('relative', 'z-[10000]');
            }
        };

        updateRect();
        window.addEventListener("resize", updateRect);
        window.addEventListener("scroll", updateRect, true);

        return () => {
            // Clean up highlights
            document.querySelectorAll('[data-tour]').forEach(element => {
                element.classList.remove('relative', 'z-[10000]');
            });
            window.removeEventListener("resize", updateRect);
            window.removeEventListener("scroll", updateRect, true);
        };
    }, [step, steps]);

    if (!rect) return null;

    // Calculate tooltip position - ensure it doesn't go off screen
    const tooltipTop = Math.min(rect.bottom + 16, window.innerHeight - 350);
    const tooltipLeft = Math.min(rect.left, window.innerWidth - 384);

    return (
        <>
            {/* Overlay with cutout effect using CSS clip-path */}
            <div 
                className="fixed inset-0 bg-black/50 pointer-events-none z-[9999]"
                style={{
                    clipPath: `polygon(
                        0% 0%, 
                        0% 100%, 
                        ${rect.left - 8}px 100%, 
                        ${rect.left - 8}px ${rect.top - 8}px, 
                        ${rect.right + 8}px ${rect.top - 8}px, 
                        ${rect.right + 8}px ${rect.bottom + 8}px, 
                        ${rect.left - 8}px ${rect.bottom + 8}px, 
                        ${rect.left - 8}px 100%, 
                        100% 100%, 
                        100% 0%
                    )`
                }}
            />

            {/* Highlight ring around the element */}
            <div 
                className="fixed pointer-events-none z-[9998] border-4 border-green-400 rounded transition-all duration-300"
                style={{
                    top: rect.top - 4,
                    left: rect.left - 4,
                    width: rect.width + 8,
                    height: rect.height + 8,
                }}
            />

            {/* Tour tooltip */}
            <div 
                className="fixed bg-white rounded-xl shadow-2xl p-6 max-w-md z-[10001] transition-all duration-300 pointer-events-auto"
                style={{
                    top: tooltipTop,
                    left: tooltipLeft,
                }}
            >
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {steps[step].title}
                </h3>
                <p className="text-gray-600 mb-6">
                    {steps[step].description}
                </p>
                
                <div className="flex justify-between items-center">
                    <button
                        onClick={handleBack}
                        disabled={step === 0}
                        className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 
                                 disabled:cursor-not-allowed transition-colors"
                    >
                        <FaArrowLeft className="mr-2" />
                        Back
                    </button>
                    <button
                        onClick={handleNext}
                        className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 
                                 transition-colors"
                    >
                        {step === steps.length - 1 ? 'Finish' : 'Next'}
                        {step !== steps.length - 1 && <FaArrowRight className="ml-2" />}
                    </button>
                </div>

                {/* Progress dots */}
                <div className="mt-4 flex justify-center gap-2">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={`h-2 w-2 rounded-full transition-colors duration-300 
                                      ${i === step ? 'bg-green-600' : 'bg-gray-300'}`}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}

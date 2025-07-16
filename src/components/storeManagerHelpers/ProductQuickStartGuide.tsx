'use client';

import React, { useState } from 'react';
import { FaLightbulb, FaCamera, FaTags, FaDollarSign, FaShippingFast, FaCheckCircle } from 'react-icons/fa';
import Button from '../buttons/Button';

interface ProductQuickStartGuideProps {
    onClose: () => void;
    onStartAdding: () => void;
}

export default function ProductQuickStartGuide({ onClose, onStartAdding }: ProductQuickStartGuideProps) {
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        {
            icon: <FaCamera className="w-8 h-8" />,
            title: "High-Quality Images",
            description: "Upload clear, well-lit photos from multiple angles. The first image will be your main product photo.",
            tips: [
                "Use natural lighting when possible",
                "Show the product against a clean background",
                "Include close-up shots of important details",
                "Upload 3-5 images for best results"
            ]
        },
        {
            icon: <FaTags className="w-8 h-8" />,
            title: "Descriptive Information",
            description: "Write clear, detailed descriptions that help customers understand your product.",
            tips: [
                "Include materials and construction details",
                "Mention best fishing conditions",
                "Add size, color, and pattern information",
                "Explain any special features or techniques"
            ]
        },
        {
            icon: <FaDollarSign className="w-8 h-8" />,
            title: "Competitive Pricing",
            description: "Research similar products and set a competitive price that reflects your product's value.",
            tips: [
                "Consider your material and time costs",
                "Check prices of similar products",
                "Factor in shipping costs",
                "Leave room for discounts and promotions"
            ]
        },
        {
            icon: <FaShippingFast className="w-8 h-8" />,
            title: "Accurate Shipping Info",
            description: "Measure your package dimensions carefully for accurate shipping calculations.",
            tips: [
                "Measure length, width, and height in inches",
                "Weigh the package in pounds",
                "Include packaging materials in measurements",
                "Update dimensions if packaging changes"
            ]
        },
        {
            icon: <FaCheckCircle className="w-8 h-8" />,
            title: "Inventory Management",
            description: "Set up quantity tracking to manage your stock levels effectively.",
            tips: [
                "Enable quantity tracking for limited stock",
                "Set low stock alerts to reorder in time",
                "Define quantity options (e.g., 1, 6, 12, 24)",
                "Keep stock levels updated"
            ]
        }
    ];

    const currentStepData = steps[currentStep];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-green-600 text-white p-6">
                    <div className="flex items-center gap-3 mb-2">
                        <FaLightbulb className="w-6 h-6" />
                        <h2 className="text-2xl font-bold">Product Quick Start Guide</h2>
                    </div>
                    <p className="text-blue-100">
                        Follow these best practices to create compelling product listings that attract customers
                    </p>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[60vh]">
                    {/* Progress Indicator */}
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex space-x-2">
                            {steps.map((_, index) => (
                                <div
                                    key={index}
                                    className={`w-3 h-3 rounded-full transition-colors ${
                                        index <= currentStep ? 'bg-blue-600' : 'bg-gray-300'
                                    }`}
                                />
                            ))}
                        </div>
                        <span className="text-sm text-gray-600">
                            {currentStep + 1} of {steps.length}
                        </span>
                    </div>

                    {/* Step Content */}
                    <div className="text-center mb-6">
                        <div className="text-blue-600 mb-4 flex justify-center">
                            {currentStepData.icon}
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                            {currentStepData.title}
                        </h3>
                        <p className="text-gray-600 mb-6">
                            {currentStepData.description}
                        </p>
                    </div>

                    {/* Tips */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-semibold text-gray-900 mb-3">Pro Tips:</h4>
                        <ul className="space-y-2">
                            {currentStepData.tips.map((tip, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                                    <span className="text-blue-600 mt-1">•</span>
                                    <span>{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t p-6 flex justify-between items-center">
                    <Button
                        text="Skip Guide"
                        onClick={onClose}
                        className="bg-gray-500 hover:bg-gray-600"
                    />
                    
                    <div className="flex gap-3">
                        {currentStep > 0 && (
                            <Button
                                text="Previous"
                                onClick={() => setCurrentStep(currentStep - 1)}
                                className="bg-gray-500 hover:bg-gray-600"
                            />
                        )}
                        
                        {currentStep < steps.length - 1 ? (
                            <Button
                                text="Next"
                                onClick={() => setCurrentStep(currentStep + 1)}
                            />
                        ) : (
                            <Button
                                text="Start Adding Products"
                                onClick={onStartAdding}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
} 
'use client';

import React, { useState } from "react";
import Input from "./Input";
import FormFieldTooltip from "./FormFieldTooltip";
import { FaPlus, FaTimes } from "react-icons/fa";

interface NumberTagInputProps {
    selectedNumbers: number[];
    onChange: (newNumbers: number[]) => void;
    label: string;
    placeholder?: string;
    min?: number;
    max?: number;
    disabled?: boolean;
    tooltip?: {
        content: string | React.ReactNode;
        type?: 'info' | 'help' | 'tip';
    };
    helperText?: string;
}

const NumberTagInput = React.forwardRef<HTMLInputElement, NumberTagInputProps>(({ 
    selectedNumbers, 
    onChange, 
    label, 
    placeholder = "Type a quantity and press Enter",
    min = 1,
    max = 999,
    disabled = false,
    tooltip,
    helperText
}, ref) => {
    const [input, setInput] = useState<string>("");
    const [error, setError] = useState<string>("");
    const [showAddButton, setShowAddButton] = useState<boolean>(false);
    
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        addNumber();
    }

    const addNumber = () => {
        if (disabled) return;
        
        const trimmedInput = input.trim();
        if (!trimmedInput) return;
        
        const number = parseInt(trimmedInput);
        
        // Validation
        if (isNaN(number)) {
            setError("Please enter a valid number");
            return;
        }
        
        if (number < min) {
            setError(`Number must be at least ${min}`);
            return;
        }
        
        if (number > max) {
            setError(`Number must be no more than ${max}`);
            return;
        }
        
        if (selectedNumbers.includes(number)) {
            setError("This quantity is already added");
            return;
        }
        
        // Add the number and sort the array
        const newNumbers = [...selectedNumbers, number].sort((a, b) => a - b);
        onChange(newNumbers);
        setInput("");
        setError("");
        setShowAddButton(false);
    }
    
    const handleRemove = (numberToRemove: number) => {
        if (disabled) return;
        onChange(selectedNumbers.filter(num => num !== numberToRemove));
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInput(value);
        setShowAddButton(value.trim().length > 0);
        if (error) setError(""); // Clear error when user starts typing
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addNumber();
        }
    }

    return (
        <div className="flex flex-col w-full mb-2 gap-2">
            <div className="flex items-center gap-2 mb-1">
                <label className="text-sm font-medium text-gray-700">{label}</label>
                {tooltip && (
                    <FormFieldTooltip 
                        type={tooltip.type} 
                        content={tooltip.content}
                        size="sm"
                    />
                )}
            </div>
            
            {/* Input with Add Button */}
            <div className="relative">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <div className="flex-1">
                        <Input 
                            ref={ref}
                            value={input} 
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            type="number"
                            min={min}
                            max={max}
                            disabled={disabled}
                            helperText={helperText}
                            error={error}
                        />
                    </div>
                    {showAddButton && !disabled && (
                        <button
                            type="button"
                            onClick={addNumber}
                            className="px-3 h-[40px] bg-greenPrimary text-white border border-greenPrimary rounded-lg hover:bg-green-800 hover:border-green-800 transition-colors flex items-center gap-2 text-sm font-medium shadow-input"
                            title="Add quantity"
                        >
                            <FaPlus className="w-3 h-3" />
                            Add
                        </button>
                    )}
                </form>
            </div>

            {/* Instructions */}
            {selectedNumbers.length === 0 && (
                <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="flex items-start gap-2">
                        <FaPlus className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-medium text-gray-600 mb-1">How to add quantities:</p>
                            <ul className="text-xs text-gray-500 space-y-1">
                                <li>• Type a quantity in the input field above</li>
                                <li>• Press <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Enter</kbd> or click the "Add" button</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Numbers Display */}
            {selectedNumbers.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                            {selectedNumbers.length} quantity option{selectedNumbers.length !== 1 ? 's' : ''} added
                        </span>
                    </div>
                    <div className="flex flex-row flex-wrap gap-2">
                        {selectedNumbers.map(number => (
                            <div 
                                key={number} 
                                className={`bg-green-50 text-greenPrimary px-3 py-1.5 border border-green-200 rounded-full text-sm transition-all duration-200 flex items-center gap-2 ${
                                    disabled 
                                        ? 'cursor-not-allowed opacity-50' 
                                        : 'hover:border-red-300 hover:bg-red-50 hover:text-red-700 cursor-pointer'
                                }`} 
                                onClick={() => handleRemove(number)}
                                title={disabled ? "Disabled" : "Click to remove"}
                            >
                                <span className="font-medium">{number}</span>
                                {!disabled && (
                                    <FaTimes className="w-3 h-3 hover:text-red-600 transition-colors" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
});

NumberTagInput.displayName = 'NumberTagInput';

export default NumberTagInput; 
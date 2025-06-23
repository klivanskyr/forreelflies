'use client';

import { useState } from "react";
import Input from "./Input";

interface NumberTagInputProps {
    selectedNumbers: number[];
    onChange: (newNumbers: number[]) => void;
    label: string;
    placeholder?: string;
    min?: number;
    max?: number;
}

export default function NumberTagInput({ 
    selectedNumbers, 
    onChange, 
    label, 
    placeholder = "Enter a number and press Enter",
    min = 1,
    max = 999
}: NumberTagInputProps) {
    const [input, setInput] = useState<string>("");
    const [error, setError] = useState<string>("");
    
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
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
    }
    
    const handleRemove = (numberToRemove: number) => {
        onChange(selectedNumbers.filter(num => num !== numberToRemove));
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setInput(e.target.value);
        if (error) setError(""); // Clear error when user starts typing
    }

    return (
        <div className="flex flex-col w-full mb-2 gap-1">
            <form onSubmit={handleSubmit}>
                <Input 
                    label={label} 
                    value={input} 
                    onChange={handleInputChange}
                    placeholder={placeholder}
                    type="number"
                    min={min}
                    max={max}
                />
            </form>
            
            {error && (
                <p className="text-red-500 text-sm">{error}</p>
            )}
            
            <div className="flex flex-row flex-wrap gap-2">
                {selectedNumbers.map(number => (
                    <div 
                        key={number} 
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full hover:bg-red-100 hover:text-red-800 cursor-pointer transition-colors flex items-center gap-1" 
                        onClick={() => handleRemove(number)}
                        title="Click to remove"
                    >
                        <span>{number}</span>
                        <span className="text-xs">×</span>
                    </div>
                ))}
            </div>
            
            {selectedNumbers.length === 0 && (
                <p className="text-gray-500 text-sm">No quantities added yet. Add at least one quantity option.</p>
            )}
            
            {selectedNumbers.length > 0 && (
                <p className="text-gray-600 text-sm">
                    {selectedNumbers.length} quantity option{selectedNumbers.length !== 1 ? 's' : ''} added: {selectedNumbers.join(', ')}
                </p>
            )}
        </div>
    )
} 
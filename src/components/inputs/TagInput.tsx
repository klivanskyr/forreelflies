'use client';

import { useState } from "react";
import Input from "./Input";
import FormFieldTooltip from "./FormFieldTooltip";
import { FaPlus, FaTimes } from "react-icons/fa";

interface TagInputProps {
    selectedTags: string[];
    onChange: (newTags: string[]) => void;
    label: string;
    disabled?: boolean;
    tooltip?: {
        content: string | React.ReactNode;
        type?: 'info' | 'help' | 'tip';
    };
    helperText?: string;
    placeholder?: string;
}

export default function TagInput({ 
    selectedTags, 
    onChange, 
    label, 
    disabled = false,
    tooltip,
    helperText,
    placeholder = "Type a tag and press Enter"
}: TagInputProps) {
    const [input, setInput] = useState<string>("");
    const [showAddButton, setShowAddButton] = useState<boolean>(false);
    
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        addTag();
    }

    const addTag = () => {
        if (disabled) return;
        
        const formattedInput = input.trim();
        if (formattedInput && !selectedTags.map(tag => tag.toLowerCase()).includes(formattedInput.toLowerCase())) {
            onChange([...selectedTags, formattedInput]);
            setInput("");
            setShowAddButton(false);
        }
    }
    
    const handleRemove = (tag: string) => {
        if (!disabled) {
            onChange(selectedTags.filter(t => t !== tag));
        }
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setInput(value);
        setShowAddButton(value.trim().length > 0);
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addTag();
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
                            value={input} 
                            onChange={handleInputChange}
                            onKeyDown={handleKeyDown}
                            disabled={disabled}
                            placeholder={placeholder}
                            helperText={helperText}
                        />
                    </div>
                    {showAddButton && !disabled && (
                        <button
                            type="button"
                            onClick={addTag}
                            className="px-3 h-[40px] bg-greenPrimary text-white border border-greenPrimary rounded-lg hover:bg-green-800 hover:border-green-800 transition-colors flex items-center gap-2 text-sm font-medium shadow-input"
                            title="Add tag"
                        >
                            <FaPlus className="w-3 h-3" />
                            Add
                        </button>
                    )}
                </form>
            </div>

            {/* Instructions */}
            {selectedTags.length === 0 && (
                <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <div className="flex items-start gap-2">
                        <FaPlus className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="font-medium text-gray-600 mb-1">How to add tags:</p>
                            <ul className="text-xs text-gray-500 space-y-1">
                                <li>• Type your tag in the input field above</li>
                                <li>• Press <kbd className="px-1 py-0.5 bg-gray-200 rounded text-xs">Enter</kbd> or click the "Add" button</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {/* Tags Display */}
            {selectedTags.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">
                            {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''} added
                        </span>
                    </div>
                    <div className="flex flex-row flex-wrap gap-2">
                        {selectedTags.map(tag => (
                            <div 
                                key={tag} 
                                className={`bg-green-50 text-greenPrimary px-3 py-1.5 border border-green-200 rounded-full text-sm transition-all duration-200 flex items-center gap-2 ${
                                    disabled 
                                        ? 'cursor-not-allowed opacity-50' 
                                        : 'hover:border-red-300 hover:bg-red-50 hover:text-red-700 cursor-pointer'
                                }`} 
                                onClick={() => handleRemove(tag)}
                                title={disabled ? "Disabled" : "Click to remove"}
                            >
                                <span className="font-medium">{tag}</span>
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
}
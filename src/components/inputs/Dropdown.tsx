'use client';

import { useState, useRef, useEffect } from "react";
import { FaChevronDown } from "react-icons/fa";
import FormFieldTooltip from "./FormFieldTooltip";

interface DropdownProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    options: {
        value: string;
        label: string;
    }[],
    selected: {
        label: string;
        value: string;
    }
    setSelected: (selected: string) => void;
    classNames?: {
        select?: string,
        option?: string
    }
    tooltip?: {
        content: string | React.ReactNode;
        type?: 'info' | 'help' | 'tip';
    };
    helperText?: string;
    disabled?: boolean;
}

export default function Dropdown({ 
    classNames, 
    label, 
    options, 
    selected, 
    setSelected,
    tooltip,
    helperText,
    disabled = false
}: DropdownProps) {
    const [open, setOpen] = useState<boolean>(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleToggle = () => {
        if (!disabled) {
            setOpen(!open);
        }
    };

    const handleSelect = (value: string) => {
        if (!disabled) {
            setSelected(value);
            setOpen(false);
        }
    };

    return (
        <div className="w-full h-fit flex flex-col relative" ref={dropdownRef}>
            {label && (
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
            )}
            <button 
                className={`${classNames?.select || ""} flex flex-row justify-between items-center w-full border h-[40px] px-3 py-2 rounded-lg shadow-input outline-none focus:outline-2 focus:outline-blue-500 transition-all duration-200 ${
                    disabled 
                        ? 'bg-gray-100 cursor-not-allowed opacity-50' 
                        : 'bg-white cursor-pointer hover:border-gray-400'
                }`}
                onClick={handleToggle}
                disabled={disabled}
            >
                <p className="text-gray-700">{selected.label}</p>
                <FaChevronDown className={`${open ? "rotate-180" : ""} transition-all duration-200 text-gray-500`} />
            </button>
            
            {helperText && (
                <p className="text-xs text-gray-500 mt-1">{helperText}</p>
            )}
            
            {open && !disabled && (
                <div className="absolute bottom-0 left-0 translate-y-[95%] bg-white border border-gray-200 w-full h-fit max-h-[200px] rounded-lg shadow-lg z-50">
                    <div className="p-1 max-h-[200px] overflow-y-auto">
                        {options.map((option, index) => (
                            <button 
                                key={index} 
                                onClick={() => handleSelect(option.value)}
                                className={`${classNames?.option || ""} w-full text-left py-2 px-3 hover:bg-gray-100 cursor-pointer rounded transition-colors duration-150 ${
                                    selected.value === option.value ? 'bg-blue-50 text-blue-700' : 'text-gray-700'
                                }`}
                            >
                                {option.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
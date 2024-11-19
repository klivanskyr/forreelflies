'use client';

import { useState } from "react";
import { FaChevronDown } from "react-icons/fa";

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
}

export default function Dropdown({ classNames, label, options, selected, setSelected }: DropdownProps) {
    const [open, setOpen] = useState<boolean>(false);

    return (
        <div className="w-full flex flex-col relative cursor-pointer" onClick={() => setOpen(!open)}>
            <div className="w-full h-full flex flex-col">
                {label && <label className="text-sm">{label}</label>}
                <div className={`${classNames?.select || ""} flex flex-row justify-between items-center my-1 w-full border h-[40px] px-3 py-2 rounded-lg shadow-input outline-none focus:outline-2 focus:outline-blue-500`}>
                    <p className="">{selected.label}</p>
                    <div onClick={() => setOpen(true)}>
                        <FaChevronDown className={`${open ? "rotate-180" : ""} transition-all duration-200`} />
                    </div>
                </div>
            </div>
            {open && (
                <div className="absolute bottom-0 left-0 translate-y-[95%] bg-white border w-full h-fit max-h-[100px] rounded-lg p-2 flex flex-col overflow-y-auto">
                    {options.map((option, index) => (
                        <div key={index}>
                            <p className={`${classNames?.option || ""} py-1 px-2 hover:bg-gray-100 cursor-pointer`} onClick={() => { setSelected(option.value); setOpen(false) }}>{option.label}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
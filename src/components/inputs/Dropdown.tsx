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
        <div className="w-full h-fit flex flex-col relative cursor-pointer" onClick={() => setOpen(!open)}>
            <div className="w-full h-fit flex flex-col">
                {label && <label className="text-sm">{label}</label>}
                <button  className={`${classNames?.select || ""} flex flex-row justify-between items-center my-1 w-full border h-[40px] px-3 py-2 rounded-lg shadow-input outline-none focus:outline-2 focus:outline-blue-500`}>
                    <p className="">{selected.label}</p>
                    <div onClick={() => setOpen(true)}>
                        <FaChevronDown className={`${open ? "rotate-180" : ""} transition-all duration-200`} />
                    </div>
                </button>
            </div>
            {open && (
            <div tabIndex={-1} className="absolute bottom-0 left-0 translate-y-[95%] bg-white border w-full h-fit max-h-[110px] rounded-lg p-2 pb-2 flex flex-col overflow-y-auto">
                {options.map((option, index) => (
                    <button className="text-left" key={index} onClick={() => { setSelected(option.value); setOpen(false) }}>
                        <p className={`${classNames?.option || ""} py-1 px-2 hover:bg-gray-100 cursor-pointer`}>{option.label}</p>
                    </button>
                ))}
            </div>
            )}
        </div>
    );
}
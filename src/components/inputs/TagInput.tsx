'use client';

import { useState } from "react";
import Input from "./Input";

export default function TagInput({ selectedTags, onChange, label }: { selectedTags: string[], onChange: (newTags: string[]) => void, label: string }) {
    const [input, setInput] = useState<string>("");
    
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        const formattedInput = input.trim();
        if (formattedInput && !selectedTags.map(tag => tag.toLowerCase()).includes(formattedInput.toLowerCase())) {
            onChange([...selectedTags, formattedInput]);
            setInput("");
        }
    }
    
    const handleRemove = (tag: string) => {
        onChange(selectedTags.filter(t => t !== tag));
    }

    return (
        <div className="flex flex-col w-full mb-2 gap-0.5">
            <form onSubmit={(e) => handleSubmit(e)}>
                <Input label={label} value={input} onChange={(e) => setInput(e.target.value)} />
            </form>
            <div className="flex flex-row flex-wrap gap-1">
                {selectedTags.map(tag => (
                    <div key={tag} className="bg-gray-100 px-2 py-0.5 border rounded-full hover:border-red-600 hover:text-red-600 cursor-pointer" onClick={() => handleRemove(tag)}>
                        <p>{tag}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}
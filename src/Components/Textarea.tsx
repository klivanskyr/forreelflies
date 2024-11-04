import { FormEventHandler } from "react";

export default function Textarea<T>({ className = "", label, placeholder, onChange, value, ...props }: { className?: string, label?: string, placeholder?: string, onChange?: FormEventHandler<HTMLTextAreaElement>, value?: string, props?: T }) {
    return (
        <div className="w-full h-full">
            {label && <label className={""}>{label}</label>}
            <textarea
                placeholder={placeholder || ""}
                onChange={onChange}
                value={value}
                className={`${className} overflow-hidden resize-none w-full border px-8 py-4 rounded-lg shadow-input outline-none focus:outline-2 focus:outline-blue-500`}
                {...props}
            />
        </div>
    );
}
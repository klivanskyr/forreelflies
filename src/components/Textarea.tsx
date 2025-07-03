'use client';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
    className?: string;
    label?: string;
}

export default function Textarea({ className = "", label, ...props }: TextareaProps) {
    return (
        <div className="w-full h-fit">
            {label && <label className="text-sm">{label}</label>}
            <textarea
                className={`${className} overflow-y-auto resize-none w-full border px-3 py-1 rounded-lg shadow-input outline-none focus:outline-2 focus:outline-blue-500`}
                {...props}
            />
        </div>
    );
}
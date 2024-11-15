export default function Textarea<T>({ className = "", label, placeholder, onChange=()=>{}, value, ...props }: { className?: string, label?: string, placeholder?: string, onChange?: React.ChangeEventHandler<HTMLTextAreaElement>, value?: string, props?: T }) {
    return (
        <div className="w-full h-full">
            {label && <label className="text-sm">{label}</label>}
            <textarea
                placeholder={placeholder || ""}
                onChange={onChange}
                value={value}
                className={`${className} overflow-y-auto resize-none w-full border px-3 py-1 rounded-lg shadow-input outline-none focus:outline-2 focus:outline-blue-500`}
                {...props}
            />
        </div>
    );
}
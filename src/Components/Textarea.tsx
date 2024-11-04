export default function Textarea({ className = "", label, placeholder, type = 'text', onChange, value, ...props }: { className?: string, label?: string, placeholder?: string, type?: string, onChange?: any, value?: string, props?: any }) {
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
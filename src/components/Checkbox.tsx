export default function Checkbox({ label = "", bool, setBool, className, disabled = false }: { label?: string, bool: boolean, setBool: (newBool: boolean) => void, className?: string, disabled?: boolean }) {
    return (
        <div className="flex flex-row items-center gap-2">
            <input
                className="w-4 h-4 align-middle"
                type="checkbox"
                onChange={() => !disabled && setBool(!bool)}
                checked={bool}
                disabled={disabled}
            />
            <label className={`${className} text-sm align-middle ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>{label}</label>
        </div>
    );
}
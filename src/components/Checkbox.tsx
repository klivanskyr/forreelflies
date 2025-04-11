export default function Checkbox({ label = "", bool, setBool, className }: { label?: string, bool: boolean, setBool: (newBool: boolean) => void, className?: string }) {
    return (
        <div className="flex flex-row items-center gap-2">
            <input
                className="w-4 h-4 align-middle"
                type="checkbox"
                onChange={() => setBool(!bool)}
                checked={bool}
            />
            <label className={`${className} text-sm align-middle`}>{label}</label>
        </div>
    );
}
export default function Checkbox({ label="", bool, setBool }: { label?: string, bool: boolean, setBool: (newBool: boolean) => void }) {
    return (
        <div className="flex flex-row items-center gap-1">
            <input type="checkbox" onChange={() => setBool(!bool)} checked={bool} />
            <label className="text-sm">{label}</label>
        </div>
    )
}
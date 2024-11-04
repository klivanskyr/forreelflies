import { FormEventHandler } from "react"

type ButtonTypes = "submit" | "reset" | "button" | undefined
type Color = "white" | "green"

export default function Button({ className="", type, text, value, onChange, color="green" }: { className?: string, type: ButtonTypes, text: string, value?: string, onChange?: FormEventHandler<HTMLButtonElement>, color?: Color }) {
    return (
        <div className="w-fit h-fit">
            <button
                className={`${color === "green" ? "bg-greenPrimary text-white" : "bg-white text-greenPrimary"} py-2 px-4 rounded-lg shadow-input ${className}`}
                type={type}
                value={value}
                onChange={onChange}
            >
                {text}
            </button>
        </div>
    )
}
  
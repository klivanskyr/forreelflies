type Color = "white" | "green"
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string;
    text?: string
    color?: Color
  }

export default function Button({ className="", text, color="green", ...props }: ButtonProps ) {
    return (
        <button 
            className={`${color === "green" ? "bg-greenPrimary text-white" : "bg-white text-greenPrimary border border-greenPrimary"} py-2 px-4 rounded-lg shadow-input ${className}`}
            {...props}
        >
            {text}
        </button>
    )
}
  
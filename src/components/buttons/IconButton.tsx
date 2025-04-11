interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string;
    icon: JSX.Element
  }

export default function IconButton({ className="", icon, ...props }: ButtonProps ) {
    return (
        <button 
            className={`py-2 px-4 rounded-lg shadow-input ${className}`}
            {...props}
        >
            {icon}    
        </button>
    )
}
  
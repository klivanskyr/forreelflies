'use client';

import { motion } from "framer-motion";
import { FaSpinner } from "react-icons/fa";

type Color = "white" | "green";
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    className?: string;
    loading?: boolean;
    text?: string;
    color?: Color;
}

export default function Button({ className = "", text, color = "green", loading, ...props }: ButtonProps) {
    return (
        <motion.div
            initial={{ scale: 1 }}
            animate={{ scale: 1 }}
            whileTap={{ scale: 0.95 }}
        >
            <button
                className={`${color === "green" ? "bg-greenPrimary text-white" : "bg-white text-greenPrimary border border-greenPrimary"} py-2 px-4 rounded-lg shadow-input w-full flex justify-center outline-none focus:outline-none ${className}`}
                {...props}
            >
                {!loading ? text : 
                    <motion.div
                        className="items-center justify-center flex"
                        initial={{ rotate: 0 }}
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    >
                        {<FaSpinner className="w-6 h-6" />}
                    </motion.div>
                }
            </button>
        </motion.div>
    );
}
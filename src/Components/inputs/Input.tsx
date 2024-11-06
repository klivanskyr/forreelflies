import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  label?: string;
}

export default function Input({ label, className="", ...props }: InputProps) {
  return (
    <div className="w-full h-fit flex flex-col">
      {label && <label className="text-sm">{label}</label>}
      <input
        className={`${className} my-1 w-full border h-[40px] px-8 py-2 rounded-lg shadow-input outline-none focus:outline-2 focus:outline-blue-500`}
        {...props}
      />
    </div>
  );
}
import React, { useState } from 'react';
import FormFieldTooltip from './FormFieldTooltip';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  label?: string;
  tooltip?: {
    content: string | React.ReactNode;
    type?: 'info' | 'help' | 'tip';
  };
  helperText?: string;
  error?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ 
  label, 
  className="", 
  tooltip,
  helperText,
  error,
  type,
  ...props 
}, ref) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordField = type === 'password';
  const inputType = isPasswordField && showPassword ? 'text' : type;

  return (
    <div className="w-full h-fit flex flex-col">
      {label && (
        <div className="flex items-center gap-2 mb-1">
          <label className="text-sm font-medium text-gray-700">{label}</label>
          {tooltip && (
            <FormFieldTooltip 
              type={tooltip.type} 
              content={tooltip.content}
              size="sm"
            />
          )}
        </div>
      )}
      <div className="relative">
        <input
          ref={ref}
          type={inputType}
          className={`${className} w-full border h-[40px] px-3 py-2 rounded-lg shadow-input outline-none focus:outline-2 focus:outline-blue-500 transition-all duration-200 ${
            error 
              ? 'border-red-300 focus:outline-red-500 bg-red-50' 
              : 'border-gray-300 focus:outline-blue-500 hover:border-gray-400'
          } ${isPasswordField ? 'pr-10' : ''}`}
          {...props}
        />
        {isPasswordField && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors duration-200"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <FaEyeSlash className="w-4 h-4" />
            ) : (
              <FaEye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
      {helperText && !error && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}
      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
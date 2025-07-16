import React from 'react';
import FormFieldTooltip from './FormFieldTooltip';

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
  ...props 
}, ref) => {
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
      <input
        ref={ref}
        className={`${className} w-full border h-[40px] px-3 py-2 rounded-lg shadow-input outline-none focus:outline-2 focus:outline-blue-500 transition-all duration-200 ${
          error 
            ? 'border-red-300 focus:outline-red-500 bg-red-50' 
            : 'border-gray-300 focus:outline-blue-500 hover:border-gray-400'
        }`}
        {...props}
      />
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
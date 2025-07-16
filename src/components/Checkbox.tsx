import FormFieldTooltip from './inputs/FormFieldTooltip';

interface CheckboxProps {
    label?: string;
    bool: boolean;
    setBool: (newBool: boolean) => void;
    className?: string;
    disabled?: boolean;
    tooltip?: {
        content: string | React.ReactNode;
        type?: 'info' | 'help' | 'tip';
    };
    helperText?: string;
}

export default function Checkbox({ 
    label = "", 
    bool, 
    setBool, 
    className, 
    disabled = false,
    tooltip,
    helperText
}: CheckboxProps) {
    return (
        <div className="flex flex-col gap-1">
            <div className="flex flex-row items-center gap-2">
                <input
                    className="w-4 h-4 align-middle rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-2 transition-all duration-200"
                    type="checkbox"
                    onChange={() => !disabled && setBool(!bool)}
                    checked={bool}
                    disabled={disabled}
                />
                <div className="flex items-center gap-2">
                    <label className={`${className} text-sm align-middle font-medium text-gray-700 ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                        {label}
                    </label>
                    {tooltip && (
                        <FormFieldTooltip 
                            type={tooltip.type} 
                            content={tooltip.content}
                            size="sm"
                        />
                    )}
                </div>
            </div>
            {helperText && (
                <p className="text-xs text-gray-500 ml-6">{helperText}</p>
            )}
        </div>
    );
}
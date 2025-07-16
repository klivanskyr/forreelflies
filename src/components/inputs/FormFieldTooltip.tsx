'use client';

import React, { useState } from 'react';
import { FaQuestionCircle, FaInfoCircle, FaLightbulb } from 'react-icons/fa';
import HoverPopup from '../hoverComponents/HoverPopup';

interface FormFieldTooltipProps {
  type?: 'info' | 'help' | 'tip';
  content: string | React.ReactNode;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  tooltipSize?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function FormFieldTooltip({ 
  type = 'info', 
  content, 
  className = '',
  size = 'md',
  tooltipSize = 'md'
}: FormFieldTooltipProps) {
  const [isHovered, setIsHovered] = useState(false);

  const getIcon = () => {
    switch (type) {
      case 'help':
        return <FaQuestionCircle className="text-blue-500" />;
      case 'tip':
        return <FaLightbulb className="text-yellow-500" />;
      default:
        return <FaInfoCircle className="text-gray-500" />;
    }
  };

  const getIconSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'w-3 h-3';
      case 'lg':
        return 'w-5 h-5';
      default:
        return 'w-4 h-4';
    }
  };

  const getTooltipSizeClasses = () => {
    switch (tooltipSize) {
      case 'sm':
        return 'w-32';
      case 'lg':
        return 'w-48';
      case 'xl':
        return 'w-56';
      default:
        return 'w-40';
    }
  };

  const iconClasses = getIconSizeClasses();
  const tooltipClasses = getTooltipSizeClasses();

  return (
    <HoverPopup
      classNames={{
        wrapper: `inline-flex items-center ${className}`,
        hover: `bg-white border border-gray-200 rounded-lg shadow-lg p-4 ${tooltipClasses} z-50`
      }}
      hoverElement={
        <div className="text-sm text-gray-700 leading-relaxed">
          {typeof content === 'string' ? (
            <p>{content}</p>
          ) : (
            content
          )}
        </div>
      }
    >
      <div className={`${iconClasses} cursor-help transition-colors hover:opacity-80`}>
        {getIcon()}
      </div>
    </HoverPopup>
  );
} 
import React from 'react';
import { Sparkles } from 'lucide-react';
import { TYPE_COLORS, TYPE_ICONS, TYPE_ZH } from '../../constants/index';

interface TypeBadgeProps {
  type: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

export const TypeBadge: React.FC<TypeBadgeProps> = ({ type, size = 'sm', className = "" }) => {
  const Icon = TYPE_ICONS[type] || Sparkles;
  const color = TYPE_COLORS[type] || '#ccc';
  
  const getTypeName = () => {
    return TYPE_ZH[type] || type;
  };
  
  const sizeClasses = {
    xs: 'text-[8px] px-1.5 py-0.5 gap-1',
    sm: 'text-[10px] px-2 py-1 gap-1.5',
    md: 'text-xs px-3 py-1 gap-2',
    lg: 'text-sm px-5 py-1.5 gap-2.5',
  };

  const iconSizes = {
    xs: 'w-2 h-2',
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <div 
      className={`flex items-center text-white font-black italic uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] border-2 border-slate-950 -skew-x-12 ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: color }}
    >
      <div className="skew-x-12 flex items-center gap-1.5">
        <Icon className={`${iconSizes[size]} drop-shadow-sm`} />
        <span>{getTypeName()}</span>
      </div>
    </div>
  );
};

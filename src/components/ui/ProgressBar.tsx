import React from 'react';
import { cn } from '../../utils/cn';

export interface ProgressBarProps {
  value: number; // 0 to 100
  colorClass?: string;
  showLabel?: boolean;
  className?: string;
  heightClass?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  colorClass = 'bg-teal-600',
  showLabel = false,
  className,
  heightClass = 'h-2',
}) => {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('w-full', className)}>
      {showLabel && (
        <div className="flex justify-between items-center text-xs mb-1 font-medium text-slate-600">
          <span>Progress</span>
          <span>{clamped.toFixed(1)}%</span>
        </div>
      )}
      <div className={cn('w-full rounded-full bg-slate-100 overflow-hidden', heightClass)}>
        <div
          className={cn('h-full transition-all duration-300 rounded-full', colorClass)}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};

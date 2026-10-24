import React from 'react';
import { cn } from '../../utils/cn';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'teal' | 'navy' | 'outline' | 'warning' | 'danger' | 'success' | 'stage';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center font-medium tracking-wide transition-colors';

  const variants = {
    default: 'bg-slate-100 text-slate-700 border border-slate-200/80',
    navy: 'bg-slate-900 text-white',
    teal: 'bg-teal-50 text-teal-700 border border-teal-200/80',
    outline: 'border border-slate-300 text-slate-700 bg-white',
    warning: 'bg-amber-50 text-amber-800 border border-amber-200/80',
    danger: 'bg-rose-50 text-rose-700 border border-rose-200/80',
    success: 'bg-emerald-50 text-emerald-700 border border-emerald-200/80',
    stage: 'bg-indigo-50 text-indigo-700 border border-indigo-200/80',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 rounded-md gap-1',
    md: 'text-xs px-2.5 py-1 rounded-md gap-1.5',
  };

  return (
    <span className={cn(baseStyles, variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
};

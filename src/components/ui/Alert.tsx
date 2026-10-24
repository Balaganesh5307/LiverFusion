import React from 'react';
import { cn } from '../../utils/cn';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'warning' | 'success' | 'destructive' | 'neutral';
  title?: string;
  icon?: boolean;
}

export const Alert: React.FC<AlertProps> = ({
  className,
  variant = 'info',
  title,
  icon = true,
  children,
  ...props
}) => {
  const variants = {
    info: 'bg-teal-50/70 border-teal-200 text-teal-900',
    warning: 'bg-amber-50/80 border-amber-200 text-amber-900',
    success: 'bg-emerald-50/80 border-emerald-200 text-emerald-900',
    destructive: 'bg-rose-50/80 border-rose-200 text-rose-900',
    neutral: 'bg-slate-50 border-slate-200 text-slate-800',
  };

  const iconMap = {
    info: <Info className="h-5 w-5 text-teal-600 shrink-0" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />,
    success: <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />,
    destructive: <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />,
    neutral: <Info className="h-5 w-5 text-slate-500 shrink-0" />,
  };

  return (
    <div
      role="alert"
      className={cn(
        'relative w-full rounded-xl border p-4 text-sm flex gap-3 items-start',
        variants[variant],
        className
      )}
      {...props}
    >
      {icon && iconMap[variant]}
      <div className="flex-1 space-y-1">
        {title && <h5 className="font-semibold text-xs tracking-wide uppercase">{title}</h5>}
        <div className="text-xs leading-relaxed">{children}</div>
      </div>
    </div>
  );
};

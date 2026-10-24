import React from 'react';
import { Card, CardContent } from '../ui/Card';
import { cn } from '../../utils/cn';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle: string;
  badgeText?: string;
  badgeVariant?: 'default' | 'teal' | 'warning' | 'stage';
  icon: React.FC<{ className?: string }>;
  iconBg?: string;
  iconColor?: string;
  isDemo?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  badgeText,
  badgeVariant = 'default',
  icon: Icon,
  iconBg = 'bg-slate-100',
  iconColor = 'text-slate-700',
  isDemo = false,
}) => {
  return (
    <Card className="relative overflow-hidden border-slate-200/80">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                {title}
              </span>
              {isDemo && (
                <span className="text-[9px] font-mono font-medium text-amber-700 bg-amber-50 px-1 py-0.2 rounded border border-amber-200">
                  DEMO
                </span>
              )}
            </div>
            <div className="text-2xl font-bold tracking-tight text-slate-900">{value}</div>
          </div>
          <div className={cn('p-2.5 rounded-xl flex items-center justify-center', iconBg)}>
            <Icon className={cn('w-5 h-5', iconColor)} />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between pt-3 border-t border-slate-100 text-xs">
          <span className="text-slate-500 truncate">{subtitle}</span>
          {badgeText && (
            <span
              className={cn(
                'text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0',
                badgeVariant === 'teal' && 'bg-teal-50 text-teal-700',
                badgeVariant === 'warning' && 'bg-amber-50 text-amber-700',
                badgeVariant === 'stage' && 'bg-indigo-50 text-indigo-700',
                badgeVariant === 'default' && 'bg-slate-100 text-slate-700'
              )}
            >
              {badgeText}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

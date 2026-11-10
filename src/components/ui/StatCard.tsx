import React from 'react';
import { Card } from './Card';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  badge?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  color?: 'blue' | 'indigo' | 'purple' | 'emerald' | 'amber';
}

export function StatCard({
  title,
  value,
  subtitle,
  icon,
  badge,
  trend,
  color = 'blue',
}: StatCardProps) {
  const iconColorStyles = {
    blue: 'bg-blue-600/15 text-blue-400 border border-blue-500/20',
    indigo: 'bg-indigo-600/15 text-indigo-400 border border-indigo-500/20',
    purple: 'bg-purple-600/15 text-purple-400 border border-purple-500/20',
    emerald: 'bg-emerald-600/15 text-emerald-400 border border-emerald-500/20',
    amber: 'bg-amber-600/15 text-amber-400 border border-amber-500/20',
  };

  return (
    <Card hoverable className="relative overflow-hidden flex flex-col justify-between">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</p>
          <h4 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{value}</h4>
        </div>
        <div className={`p-2.5 rounded-xl ${iconColorStyles[color]}`}>
          {icon}
        </div>
      </div>

      {(subtitle || trend || badge) && (
        <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
          <span>{subtitle}</span>
          {trend && (
            <span
              className={`font-medium ${
                trend.isPositive ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {trend.value}
            </span>
          )}
          {badge}
        </div>
      )}
    </Card>
  );
}

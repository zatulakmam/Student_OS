import React from 'react';
import { Priority, TaskStatus } from '@/types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'blue' | 'indigo' | 'emerald' | 'amber' | 'purple' | 'rose' | 'slate' | 'cyan';
  size?: 'sm' | 'md';
  className?: string;
}

export function Badge({ children, variant = 'blue', size = 'sm', className = '' }: BadgeProps) {
  const sizeStyles = {
    sm: 'text-[11px] px-2 py-0.5 font-medium rounded-full',
    md: 'text-xs px-2.5 py-1 font-medium rounded-md',
  };

  const variantStyles = {
    blue: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
    indigo: 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30',
    emerald: 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30',
    amber: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
    purple: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
    rose: 'bg-rose-500/15 text-rose-300 border border-rose-500/30',
    slate: 'bg-slate-700/40 text-slate-300 border border-slate-700',
    cyan: 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30',
  };

  return (
    <span className={`inline-flex items-center gap-1.5 shrink-0 ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}>
      {children}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: Priority }) {
  switch (priority) {
    case 'high':
      return <Badge variant="rose">Tinggi</Badge>;
    case 'medium':
      return <Badge variant="amber">Sedang</Badge>;
    case 'low':
      return <Badge variant="slate">Rendah</Badge>;
    default:
      return null;
  }
}

export function StatusBadge({ status }: { status: TaskStatus }) {
  switch (status) {
    case 'todo':
      return <Badge variant="slate">To Do</Badge>;
    case 'in_progress':
      return <Badge variant="blue">Sedang Dikerjakan</Badge>;
    case 'review':
      return <Badge variant="purple">Review</Badge>;
    case 'completed':
      return <Badge variant="emerald">Selesai</Badge>;
    default:
      return null;
  }
}
